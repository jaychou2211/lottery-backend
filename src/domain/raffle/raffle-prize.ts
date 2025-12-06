import type { EligibleCounts, BonusEligibleCounts, RegularEligibleCounts, PrizeRank } from '../shared';
import { DomainError } from '../shared';

// ============================================================
// Errors
// ============================================================

export class EmptyPrizeNameError extends DomainError {
	readonly code = 'EMPTY_PRIZE_NAME';

	constructor() {
		super('prize name cannot be empty');
	}
}

export type RafflePrizeError = EmptyPrizeNameError;

// ============================================================
// Entity
// ============================================================

export interface RafflePrizeProps {
	id?: number;
	rank: PrizeRank;
	name: string;
	eligibleCounts: EligibleCounts;
	imageUrl: string;
	isDrawn?: boolean;
	prizeTemplateId?: number;
}

/**
 * Entity: RafflePrize
 *
 * Belongs to Raffle aggregate.
 * Lifecycle is controlled by Raffle.
 *
 * Note: prizeLevel is derived from rank.level at the DTO layer.
 */
export class RafflePrize {
	private constructor(
		public readonly id: number | null,
		public readonly rank: PrizeRank,
		public readonly name: string,
		public readonly eligibleCounts: EligibleCounts,
		public readonly imageUrl: string,
		public readonly isDrawn: boolean,
		public readonly prizeTemplateId: number | null,
	) {}

	/**
	 * Creates a RafflePrize with validation.
	 *
	 * @throws EmptyPrizeNameError if name is empty
	 */
	static create(props: RafflePrizeProps): RafflePrize {
		if (!props.name.trim()) {
			throw new EmptyPrizeNameError();
		}

		return new RafflePrize(
			props.id ?? null,
			props.rank,
			props.name,
			props.eligibleCounts,
			props.imageUrl,
			props.isDrawn ?? false,
			props.prizeTemplateId ?? null,
		);
	}

	markAsDrawn<T extends RafflePrize>(this: T): T {
		return new RafflePrize(
			this.id,
			this.rank,
			this.name,
			this.eligibleCounts,
			this.imageUrl,
			true,
			this.prizeTemplateId,
		) as T;
	}

	/**
	 * Creates a new RafflePrize with a different rank.
	 * Used for auto-assigning bonus prize ranks.
	 */
	withRank<T extends RafflePrize>(this: T, rank: PrizeRank): T {
		return new RafflePrize(
			this.id,
			rank,
			this.name,
			this.eligibleCounts,
			this.imageUrl,
			this.isDrawn,
			this.prizeTemplateId,
		) as T;
	}

	isBonus(): this is BonusPrize {
		return this.eligibleCounts.isBonus();
	}

	isRegular(): this is RegularPrize {
		return this.eligibleCounts.isRegular();
	}
}

// ============================================================
// Type Refinements
// ============================================================

/**
 * A RafflePrize that has been persisted (has a valid id).
 */
export type PersistedPrize = RafflePrize & { readonly id: number };

/**
 * A RafflePrize that is a regular prize (eligibleCounts is RegularEligibleCounts).
 */
export type RegularPrize = RafflePrize & { readonly eligibleCounts: RegularEligibleCounts };

/**
 * A RafflePrize that is a bonus prize (eligibleCounts is BonusEligibleCounts).
 */
export type BonusPrize = RafflePrize & { readonly eligibleCounts: BonusEligibleCounts };

/**
 * A persisted bonus prize.
 */
export type PersistedBonusPrize = PersistedPrize & BonusPrize;
