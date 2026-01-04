import { DomainError } from './domain-error';

// ============================================================
// Errors
// ============================================================

export class InvalidTotalError extends DomainError {
	readonly code = 'INVALID_TOTAL';

	constructor(public readonly total: number) {
		super(`total must be greater than 0, got ${total}`);
	}
}

export class TotalMismatchError extends DomainError {
	readonly code = 'TOTAL_MISMATCH';

	constructor(
		public readonly total: number,
		public readonly senior: number,
		public readonly junior: number,
	) {
		super(`total (${total}) must equal senior (${senior}) + junior (${junior})`);
	}
}

export type EligibleCountsError = InvalidTotalError | TotalMismatchError;

// ============================================================
// Value Object (Discriminated Union)
// ============================================================

interface BaseEligibleCounts {
	readonly total: number;
	isBonus(): this is BonusEligibleCounts;
	isRegular(): this is RegularEligibleCounts;
	equals(other: EligibleCounts): boolean;
}

/**
 * Regular prize: draws from senior and junior pools separately.
 * Invariant: total = senior + junior
 */
export class RegularEligibleCounts implements BaseEligibleCounts {
	readonly kind = 'regular' as const;

	private constructor(
		public readonly total: number,
		public readonly senior: number,
		public readonly junior: number,
	) {}

	static create(senior: number, junior: number): RegularEligibleCounts {
		const total = senior + junior;
		if (total <= 0) {
			throw new InvalidTotalError(total);
		}
		return new RegularEligibleCounts(total, senior, junior);
	}

	/**
	 * Hydration from persistence layer.
	 * @throws TotalMismatchError if total !== senior + junior
	 */
	static hydrate(total: number, senior: number, junior: number): RegularEligibleCounts {
		if (total <= 0) {
			throw new InvalidTotalError(total);
		}
		if (total !== senior + junior) {
			throw new TotalMismatchError(total, senior, junior);
		}
		return new RegularEligibleCounts(total, senior, junior);
	}

	isBonus(): this is BonusEligibleCounts {
		return false;
	}

	isRegular(): this is RegularEligibleCounts {
		return true;
	}

	equals(other: EligibleCounts): boolean {
		return (
			other.isRegular() &&
			this.total === other.total &&
			this.senior === other.senior &&
			this.junior === other.junior
		);
	}
}

/**
 * Bonus prize: draws from all participants combined.
 */
export class BonusEligibleCounts implements BaseEligibleCounts {
	readonly kind = 'bonus' as const;

	private constructor(public readonly total: number) {}

	static create(total: number): BonusEligibleCounts {
		if (total <= 0) {
			throw new InvalidTotalError(total);
		}
		return new BonusEligibleCounts(total);
	}

	isBonus(): this is BonusEligibleCounts {
		return true;
	}

	isRegular(): this is RegularEligibleCounts {
		return false;
	}

	equals(other: EligibleCounts): boolean {
		return other.isBonus() && this.total === other.total;
	}
}

/**
 * Discriminated union of eligible counts types.
 */
export type EligibleCounts = RegularEligibleCounts | BonusEligibleCounts;
