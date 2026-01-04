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

export type PrizeError = EmptyPrizeNameError;

// ============================================================
// Entity
// ============================================================

export interface PrizeProps {
	id?: number;
	rank: PrizeRank;
	name: string;
	eligibleCounts: EligibleCounts;
	imageUrl: string;
	isDrawn?: boolean;
	prizeTemplateId?: number;
}

export interface BonusPrizeProps {
	rank: PrizeRank;
	name: string;
	eligibleCounts: BonusEligibleCounts;
	imageUrl: string;
}

/**
 * Entity: Prize
 *
 * Belongs to Raffle aggregate.
 * Lifecycle is controlled by Raffle.
 *
 * Note: prizeLevel is derived from rank.level at the DTO layer.
 */
export class Prize {
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
	 * Creates a Prize with validation.
	 *
	 * @throws EmptyPrizeNameError if name is empty
	 */
	static create(props: PrizeProps): Prize {
		if (!props.name.trim()) {
			throw new EmptyPrizeNameError();
		}

		return new Prize(
			props.id ?? null,
			props.rank,
			props.name,
			props.eligibleCounts,
			props.imageUrl,
			props.isDrawn ?? false,
			props.prizeTemplateId ?? null,
		);
	}

	/**
	 * Creates a bonus prize (no prizeTemplateId, no id until persisted).
	 */
	static createBonus(props: BonusPrizeProps): BonusPrize {
		if (!props.name.trim()) {
			throw new EmptyPrizeNameError();
		}

		return new Prize(
			null,
			props.rank,
			props.name,
			props.eligibleCounts,
			props.imageUrl,
			false,
			null,
		) as BonusPrize;
	}

	markAsDrawn(): Prize {
		return new Prize(
			this.id,
			this.rank,
			this.name,
			this.eligibleCounts,
			this.imageUrl,
			true,
			this.prizeTemplateId,
		);
	}

	/**
	 * Creates a new Prize with a different rank.
	 * Used for auto-assigning bonus prize ranks.
	 */
	withRank(rank: PrizeRank): Prize {
		return new Prize(
			this.id,
			rank,
			this.name,
			this.eligibleCounts,
			this.imageUrl,
			this.isDrawn,
			this.prizeTemplateId,
		);
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
 * A Prize that has been persisted (has a valid id).
 */
export type PersistedPrize = Prize & { readonly id: number };

/**
 * A Prize that is a regular prize (eligibleCounts is RegularEligibleCounts).
 */
export type RegularPrize = Prize & { readonly eligibleCounts: RegularEligibleCounts };

/**
 * A Prize that is a bonus prize (eligibleCounts is BonusEligibleCounts).
 */
export type BonusPrize = Prize & { readonly eligibleCounts: BonusEligibleCounts };

/**
 * A persisted bonus prize.
 */
export type PersistedBonusPrize = PersistedPrize & BonusPrize;
