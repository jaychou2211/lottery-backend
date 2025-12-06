import { RaffleStatus, DrawnGroup, PrizeRank } from '../shared';
import type { BonusEligibleCounts } from '../shared';
import type { EligibilityPool } from './eligibility-pool';
import {
	InvalidStatusTransitionError,
	NoPrizeToDrawError,
	ParticipantAlreadyWonError,
	InvalidWinnerCountError,
	InsufficientEmployeesError,
	InvalidRaffleStatusError,
	EmptyParticipantsError,
} from './errors';
import type { LotteryStrategy, WinnerInput } from './lottery-strategy';
import { Prize } from './prize';
import { PrizeDrawnEvent } from './prize-drawn-event';
import { randomLottery } from './random-lottery';

export interface BonusPrizeInput {
	name: string;
	imageUrl: string;
	eligibleCounts: BonusEligibleCounts;
}

export interface RaffleData {
	id: number;
	name: string;
	version: number;
	status: RaffleStatus;
	eligibilityPool: EligibilityPool;
	prizes: readonly Prize[];
	pendingEvents?: readonly PrizeDrawnEvent[];
}

export class Raffle {
	private constructor(
		public readonly id: number,
		public readonly name: string,
		public readonly version: number,
		public readonly status: RaffleStatus,
		public readonly eligibilityPool: EligibilityPool,
		public readonly prizes: readonly Prize[],
		public readonly pendingEvents: readonly PrizeDrawnEvent[],
	) {}

	static create(data: RaffleData): Raffle {
		const ranks = data.prizes.map((p) => p.rank);
		PrizeRank.validateConsecutiveSequences(ranks);

		return new Raffle(
			data.id,
			data.name,
			data.version,
			data.status,
			data.eligibilityPool,
			data.prizes,
			data.pendingEvents ?? [],
		);
	}

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

	private withStatus(target: RaffleStatus): Raffle {
		if (!this.canTransitionTo(target)) {
			throw new InvalidStatusTransitionError(this.status, target);
		}
		return new Raffle(
			this.id,
			this.name,
			this.version,
			target,
			this.eligibilityPool,
			this.prizes,
			this.pendingEvents,
		);
	}

	transitionToReady(): Raffle {
		if (this.eligibilityPool.totalCount === 0) {
			throw new EmptyParticipantsError();
		}

		const regularPrizes = this.prizes.filter((p) => p.isRegular());

		const totalSeniorNeeded = regularPrizes.reduce((sum, p) => sum + p.eligibleCounts.senior, 0);
		const totalJuniorNeeded = regularPrizes.reduce((sum, p) => sum + p.eligibleCounts.junior, 0);

		const seniorCount = this.eligibilityPool.seniorCount;
		const juniorCount = this.eligibilityPool.juniorCount;

		if (totalSeniorNeeded > seniorCount) {
			throw new InsufficientEmployeesError('senior', totalSeniorNeeded, seniorCount);
		}
		if (totalJuniorNeeded > juniorCount) {
			throw new InsufficientEmployeesError('junior', totalJuniorNeeded, juniorCount);
		}

		return this.withStatus(RaffleStatus.READY);
	}

	private getNextBonusRank(): PrizeRank {
		const level5Prizes = this.prizes.filter((p) => p.rank.level === 5);
		const maxSequence = level5Prizes.reduce((max, p) => Math.max(max, p.rank.sequence), 0);
		return PrizeRank.create(5, maxSequence + 1);
	}

	addBonusPrize(input: BonusPrizeInput): Raffle {
		if (this.status !== RaffleStatus.BONUS) {
			throw new InvalidRaffleStatusError('add bonus prize', this.status, RaffleStatus.BONUS);
		}

		const remainingCount = this.eligibilityPool.remainingTotalCount;
		if (remainingCount < input.eligibleCounts.total) {
			throw new InsufficientEmployeesError('bonus', input.eligibleCounts.total, remainingCount);
		}

		const rank = this.getNextBonusRank();
		const newPrize = Prize.createBonus({
			rank,
			name: input.name,
			imageUrl: input.imageUrl,
			eligibleCounts: input.eligibleCounts,
		});

		const newPrizes = [...this.prizes, newPrize];
		return new Raffle(
			this.id,
			this.name,
			this.version,
			this.status,
			this.eligibilityPool,
			newPrizes,
			this.pendingEvents,
		);
	}

	markAsCompleted(): Raffle {
		return this.withStatus(RaffleStatus.COMPLETED);
	}

	private get sortedPrizes(): readonly Prize[] {
		return [...this.prizes].sort((a, b) => a.rank.compareTo(b.rank));
	}

	private get drawablePrizes(): readonly Prize[] {
		const shouldDrawBonus = this.status === RaffleStatus.BONUS;
		return this.sortedPrizes.filter((p) => p.isBonus() === shouldDrawBonus);
	}

	private getNextDrawableRank(): PrizeRank | null {
		return this.drawablePrizes.find((p) => !p.isDrawn)?.rank ?? null;
	}

	getPrizeByRank(rank: PrizeRank): Prize | undefined {
		return this.prizes.find((p) => p.rank.equals(rank));
	}

	private validateWinnerCounts(prize: Prize, inputs: readonly WinnerInput[]): void {
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

	private computeNextStatus(updatedPrizes: readonly Prize[]): RaffleStatus {
		if (this.status === RaffleStatus.READY) {
			return RaffleStatus.IN_PROGRESS;
		}

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
		if (![RaffleStatus.READY, RaffleStatus.IN_PROGRESS, RaffleStatus.BONUS].includes(this.status)) {
			throw new InvalidRaffleStatusError(
				'draw',
				this.status,
				[RaffleStatus.READY, RaffleStatus.IN_PROGRESS, RaffleStatus.BONUS],
			);
		}

		const rank = this.getNextDrawableRank();
		if (rank === null) {
			throw new NoPrizeToDrawError();
		}

		const prize = this.getPrizeByRank(rank)!;
		if (prize.id === null) {
			throw new Error('Cannot draw unpersisted prize');
		}
		const prizeId = prize.id;
		const inputs = lottery(this.eligibilityPool, prize.eligibleCounts);

		this.validateWinnerCounts(prize, inputs);

		for (const input of inputs) {
			if (this.eligibilityPool.hasWon(input.participantId)) {
				throw new ParticipantAlreadyWonError(input.participantId);
			}
		}

		const updatedPrizes = this.prizes.map((p) =>
			p.rank.equals(rank) ? p.markAsDrawn() : p,
		);

		const newEvents = inputs.map(
			(input) => new PrizeDrawnEvent(input.participantId, prizeId, input.drawnGroup),
		);

		const wonIds = inputs.map((input) => input.participantId);
		const updatedPool = this.eligibilityPool.markManyAsWon(wonIds);

		const newStatus = this.computeNextStatus(updatedPrizes);

		return new Raffle(
			this.id,
			this.name,
			this.version,
			newStatus,
			updatedPool,
			updatedPrizes,
			[...this.pendingEvents, ...newEvents],
		);
	}
}
