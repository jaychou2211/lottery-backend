import type { Employee } from '../employee';
import { RaffleStatus, DrawnGroup, EmployeeRole } from '../shared';
import {
	InvalidStatusTransitionError,
	PrizeNotFoundError,
	AlreadyDrawnError,
	InvalidDrawOrderError,
	ParticipantAlreadyWonError,
	InvalidWinnerCountError,
	PrizeTypeMismatchError,
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
 *
 * A lottery raffle containing prizes and winner records.
 * Enforces domain invariants:
 * - Sequential drawing: prizes must be drawn in rank order
 * - One prize per employee: each employee can only win once per raffle
 * - Status transitions: DRAFT -> READY -> IN_PROGRESS -> BONUS -> COMPLETED
 * - Grouped drawing: regular prizes draw by seniority, bonus prizes draw from all
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

	static create(props: RaffleProps): Raffle {
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

	private getNextBonusRank(): number {
		const maxRank = this.prizes.reduce((max, p) => Math.max(max, p.rank), 0);
		return maxRank + 1;
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
		return [...this.prizes].sort((a, b) => a.rank - b.rank);
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

	private getNextDrawableRank(): number | null {
		return this.drawablePrizes.find((p) => !p.isDrawn)?.rank ?? null;
	}

	private getPrizeByRank(rank: number): PersistedPrize | undefined {
		return this.prizes.find((p) => p.rank === rank);
	}

	private canDrawInCurrentStatus(prize: PersistedPrize): boolean {
		switch (this.status) {
			case RaffleStatus.READY:
			case RaffleStatus.IN_PROGRESS:
				return !prize.isBonus();
			case RaffleStatus.BONUS:
				return prize.isBonus();
			default:
				return false;
		}
	}

	assertCanDraw(rank: number): void {
		const prize = this.getPrizeByRank(rank);
		if (!prize) {
			throw new PrizeNotFoundError(rank);
		}

		if (!this.canDrawInCurrentStatus(prize)) {
			throw new PrizeTypeMismatchError(prize.isBonus(), this.status);
		}

		if (prize.isDrawn) {
			throw new AlreadyDrawnError(rank);
		}

		const nextRank = this.getNextDrawableRank();
		if (nextRank !== rank) {
			throw new InvalidDrawOrderError(rank, nextRank);
		}
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

	/**
	 * Draw winners for a prize using internal participants.
	 *
	 * @param rank - The prize rank to draw
	 * @param lottery - Strategy for selecting winners (defaults to random)
	 * @returns New Raffle with updated prizes and winners
	 */
	draw(rank: number, lottery: LotteryStrategy = randomLottery): Raffle {
		// 1. Assert drawable (includes status and prize type validation)
		this.assertCanDraw(rank);

		// Prize is guaranteed to exist after assertCanDraw
		const prize = this.getPrizeByRank(rank)!;

		// 2. Get eligible participants (filter out already won)
		const eligible = this.getEligibleParticipants();

		// 3. Execute lottery to select winners
		const inputs = lottery(eligible, prize.eligibleCounts);

		// 4. Validate winner counts match prize requirements
		this.validateWinnerCounts(prize, inputs);

		// 5. Defensive check: lottery must not return already-won participants
		for (const input of inputs) {
			if (this.hasParticipantWon(input.participantId)) {
				throw new ParticipantAlreadyWonError(input.participantId);
			}
		}

		// 6. Mark prize as drawn
		const updatedPrizes = this.prizes.map((p) =>
			p.rank === rank ? p.markAsDrawn() : p,
		);

		// 7. Create WinnerRecords (prize.id is guaranteed non-null via PersistedPrize type)
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

		// 8. Compute next status (automatic transitions)
		const newStatus = this.computeNextStatus(updatedPrizes);

		return new Raffle(this.id, this.name, newStatus, updatedPrizes, this.participants, updatedWinners);
	}
}
