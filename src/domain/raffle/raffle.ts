import type { Employee } from '../employee';
import { RaffleStatus, DrawnGroup, EmployeeRole, PrizeRank } from '../shared';
import {
	InvalidStatusTransitionError,
	NoPrizeToDrawError,
	ParticipantAlreadyWonError,
	InvalidWinnerCountError,
	InsufficientEmployeesError,
	InvalidRaffleStatusError,
	DuplicateParticipantError,
	EmptyParticipantsError,
} from './errors';
import type { LotteryStrategy, WinnerInput } from './lottery-strategy';
import { RaffleParticipant, type PersistedParticipant } from './raffle-participant';
import type { PersistedPrize, PersistedBonusPrize, RegularPrize } from './raffle-prize';
import { randomLottery } from './random-lottery';
import { WinnerRecord } from './winner-record';

export interface RaffleProps {
	id: number;
	name: string;
	prizes: PersistedPrize[];
	participants?: RaffleParticipant[];
	winners?: WinnerRecord[];
	status?: RaffleStatus;
}

/**
 * Aggregate Root: Raffle
 */
export class Raffle {
	private constructor(
		public readonly id: number,
		public readonly name: string,
		public readonly status: RaffleStatus,
		public readonly prizes: readonly PersistedPrize[],
		public readonly participants: readonly RaffleParticipant[],
		public readonly winners: readonly WinnerRecord[],
	) {}

	/**
	 * Creates a Raffle with validation.
	 *
	 * @throws NonConsecutiveSequenceError if prize ranks have gaps in sequences within any level
	 * @throws SequenceNotStartingFromOneError if any level's sequences don't start from 1
	 */
	static create(props: RaffleProps): Raffle {
		// Validate prize ranks have consecutive sequences per level
		const ranks = props.prizes.map((p) => p.rank);
		PrizeRank.validateConsecutiveSequences(ranks);

		return new Raffle(
			props.id,
			props.name,
			props.status ?? RaffleStatus.DRAFT,
			props.prizes,
			props.participants ?? [],
			props.winners ?? [],
		);
	}

	/**
	 * Allowed manual status transitions.
	 * Empty array means no manual transitions allowed (only automatic via draw()).
	 */
	private static readonly ALLOWED_MANUAL_TRANSITIONS: Record<RaffleStatus, RaffleStatus[]> = {
		[RaffleStatus.DRAFT]: [RaffleStatus.READY],
		[RaffleStatus.READY]: [],
		[RaffleStatus.IN_PROGRESS]: [],
		[RaffleStatus.BONUS]: [RaffleStatus.COMPLETED],
		[RaffleStatus.COMPLETED]: [],
	};

	private canTransitionTo(target: RaffleStatus): boolean {
		return Raffle.ALLOWED_MANUAL_TRANSITIONS[this.status].includes(target);
	}

	private transitionTo(target: RaffleStatus): Raffle {
		if (!this.canTransitionTo(target)) {
			throw new InvalidStatusTransitionError(this.status, target);
		}
		return new Raffle(this.id, this.name, target, this.prizes, this.participants, this.winners);
	}

	/**
	 * Transition to READY status after validating participant sufficiency.
	 * Only validates regular prizes (bonus prizes are added dynamically in BONUS status).
	 *
	 * @throws EmptyParticipantsError if no participants have been added
	 * @throws InsufficientEmployeesError if role counts don't meet prize requirements
	 */
	transitionToReady(): Raffle {
		if (this.participants.length === 0) {
			throw new EmptyParticipantsError();
		}

		const regularPrizes = this.prizes.filter((p): p is PersistedPrize & RegularPrize => p.isRegular());

		const totalSeniorNeeded = regularPrizes.reduce((sum, p) => sum + p.eligibleCounts.senior, 0);
		const totalJuniorNeeded = regularPrizes.reduce((sum, p) => sum + p.eligibleCounts.junior, 0);

		const seniorCount = this.participants.filter((p) => p.role === EmployeeRole.SENIOR).length;
		const juniorCount = this.participants.filter((p) => p.role === EmployeeRole.JUNIOR).length;

		if (totalSeniorNeeded > seniorCount) {
			throw new InsufficientEmployeesError('senior', totalSeniorNeeded, seniorCount);
		}
		if (totalJuniorNeeded > juniorCount) {
			throw new InsufficientEmployeesError('junior', totalJuniorNeeded, juniorCount);
		}

		return this.transitionTo(RaffleStatus.READY);
	}

	/**
	 * Add participants from Employee list.
	 * Creates snapshots of Employee data at the time of addition.
	 *
	 * @throws InvalidRaffleStatusError if not in DRAFT status
	 * @throws DuplicateParticipantError if any employeeId is duplicated
	 */
	addParticipants(employees: readonly Employee[]): Raffle {
		if (this.status !== RaffleStatus.DRAFT) {
			throw new InvalidRaffleStatusError('add participants', this.status, RaffleStatus.DRAFT);
		}

		if (employees.length === 0) {
			return this;
		}

		// Check for duplicates in input
		const inputIds = new Set<number>();
		for (const emp of employees) {
			if (inputIds.has(emp.id)) {
				throw new DuplicateParticipantError(emp.id);
			}
			inputIds.add(emp.id);
		}

		// Check for duplicates with existing participants
		const existingIds = new Set(this.participants.map((p) => p.employeeId));
		for (const emp of employees) {
			if (existingIds.has(emp.id)) {
				throw new DuplicateParticipantError(emp.id);
			}
		}

		// Create new participants (ID is null until persisted)
		const newParticipants = employees.map((emp) => RaffleParticipant.fromEmployee(emp));

		return new Raffle(
			this.id,
			this.name,
			this.status,
			this.prizes,
			[...this.participants, ...newParticipants],
			this.winners,
		);
	}

	/**
	 * Get the next bonus rank.
	 * Bonus prizes continue the sequence of level 5 after all existing prizes.
	 */
	private getNextBonusRank(): PrizeRank {
		const level5Prizes = this.prizes.filter((p) => p.rank.level === 5);
		const maxSequence = level5Prizes.reduce((max, p) => Math.max(max, p.rank.sequence), 0);
		return PrizeRank.create(5, maxSequence + 1);
	}

	/**
	 * Add a bonus prize during BONUS status.
	 * Validates that remaining (non-won) participants >= prize total.
	 * Rank is auto-assigned to be after all existing prizes.
	 *
	 * Type safety: Only accepts PersistedBonusPrize, eliminating InvalidBonusPrizeError.
	 */
	addBonusPrize(prize: PersistedBonusPrize): Raffle {
		if (this.status !== RaffleStatus.BONUS) {
			throw new InvalidRaffleStatusError('add bonus prize', this.status, RaffleStatus.BONUS);
		}

		const remainingCount = this.participants.length - this.winners.length;
		if (remainingCount < prize.eligibleCounts.total) {
			throw new InsufficientEmployeesError('bonus', prize.eligibleCounts.total, remainingCount);
		}

		// Auto-assign rank to ensure uniqueness and correct ordering
		const prizeWithRank = prize.withRank(this.getNextBonusRank());
		const newPrizes = [...this.prizes, prizeWithRank];
		return new Raffle(this.id, this.name, this.status, newPrizes, this.participants, this.winners);
	}

	markAsCompleted(): Raffle {
		return this.transitionTo(RaffleStatus.COMPLETED);
	}

	private get sortedPrizes(): readonly PersistedPrize[] {
		return [...this.prizes].sort((a, b) => a.rank.compareTo(b.rank));
	}

	/**
	 * Returns prizes that can be drawn in the current status.
	 * - In READY/IN_PROGRESS: regular prizes only
	 * - In BONUS: bonus prizes only
	 */
	private get drawablePrizes(): readonly PersistedPrize[] {
		const shouldDrawBonus = this.status === RaffleStatus.BONUS;
		return this.sortedPrizes.filter((p) => p.isBonus() === shouldDrawBonus);
	}

	private getNextDrawableRank(): PrizeRank | null {
		return this.drawablePrizes.find((p) => !p.isDrawn)?.rank ?? null;
	}

	getPrizeByRank(rank: PrizeRank): PersistedPrize | undefined {
		return this.prizes.find((p) => p.rank.equals(rank));
	}

	hasParticipantWon(participantId: number): boolean {
		return this.winners.some((w) => w.participantId === participantId);
	}

	private getEligibleParticipants(): readonly PersistedParticipant[] {
		return this.participants.filter(
			(p): p is PersistedParticipant => p.id !== null && !this.hasParticipantWon(p.id),
		);
	}

	private validateWinnerCounts(prize: PersistedPrize, inputs: readonly WinnerInput[]): void {
		const { eligibleCounts } = prize;

		if (eligibleCounts.isRegular()) {
			const seniorCount = inputs.filter((w) => w.drawnGroup === DrawnGroup.SENIOR).length;
			const juniorCount = inputs.filter((w) => w.drawnGroup === DrawnGroup.JUNIOR).length;

			if (seniorCount !== eligibleCounts.senior) {
				throw new InvalidWinnerCountError('senior', eligibleCounts.senior, seniorCount);
			}
			if (juniorCount !== eligibleCounts.junior) {
				throw new InvalidWinnerCountError('junior', eligibleCounts.junior, juniorCount);
			}
		} else {
			const allCount = inputs.filter((w) => w.drawnGroup === DrawnGroup.ALL).length;
			if (allCount !== eligibleCounts.total) {
				throw new InvalidWinnerCountError('all', eligibleCounts.total, allCount);
			}
		}
	}

	private computeNextStatus(updatedPrizes: readonly PersistedPrize[]): RaffleStatus {
		// READY → IN_PROGRESS: first draw
		if (this.status === RaffleStatus.READY) {
			return RaffleStatus.IN_PROGRESS;
		}

		// IN_PROGRESS → BONUS: all regular prizes drawn
		if (this.status === RaffleStatus.IN_PROGRESS) {
			const allRegularDrawn = updatedPrizes
				.filter((p) => !p.isBonus())
				.every((p) => p.isDrawn);

			if (allRegularDrawn) {
				return RaffleStatus.BONUS;
			}
		}

		return this.status;
	}

	draw(lottery: LotteryStrategy = randomLottery): Raffle {
		const rank = this.getNextDrawableRank();
		if (rank === null) {
			throw new NoPrizeToDrawError();
		}

		const prize = this.getPrizeByRank(rank)!;
		const eligible = this.getEligibleParticipants();
		const inputs = lottery(eligible, prize.eligibleCounts);

		this.validateWinnerCounts(prize, inputs);

		for (const input of inputs) {
			if (this.hasParticipantWon(input.participantId)) {
				throw new ParticipantAlreadyWonError(input.participantId);
			}
		}

		const updatedPrizes = this.prizes.map((p) =>
			p.rank.equals(rank) ? p.markAsDrawn() : p,
		);

		const now = new Date();
		const newWinners = inputs.map((input) =>
			WinnerRecord.create({
				rafflePrizeId: prize.id,
				participantId: input.participantId,
				drawnGroup: input.drawnGroup,
				createdAt: now,
			}),
		);
		const updatedWinners = [...this.winners, ...newWinners];

		const newStatus = this.computeNextStatus(updatedPrizes);

		return new Raffle(this.id, this.name, newStatus, updatedPrizes, this.participants, updatedWinners);
	}
}
