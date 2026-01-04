import { DomainError } from './domain-error';

// ============================================================
// Errors
// ============================================================

export class InvalidPrizeRankFormatError extends DomainError {
	readonly code = 'INVALID_PRIZE_RANK_FORMAT';

	constructor(public readonly value: string) {
		super(`prize rank must be in format "{level}-{sequence}", got "${value}"`);
	}
}

export class InvalidPrizeSequenceError extends DomainError {
	readonly code = 'INVALID_PRIZE_SEQUENCE';

	constructor(public readonly sequence: number) {
		super(`prize sequence must be positive, got ${sequence}`);
	}
}

export class NonConsecutiveSequenceError extends DomainError {
	readonly code = 'NON_CONSECUTIVE_SEQUENCE';

	constructor(
		public readonly level: number,
		public readonly sequences: readonly number[],
	) {
		super(`sequences for level ${level} must be consecutive starting from 1, got [${sequences.join(', ')}]`);
	}
}

export type PrizeRankError = InvalidPrizeRankFormatError | InvalidPrizeSequenceError | NonConsecutiveSequenceError;

// ============================================================
// Value Object
// ============================================================

const RANK_PATTERN = /^(\d+)-(\d+)$/;

const PRIZE_LEVEL_NAMES: Record<number, string> = {
	1: '小獎',
	2: '中獎',
	3: '大獎',
	4: '特大獎',
	5: '頭獎',
};

/**
 * Value Object: PrizeRank
 *
 * Represents a prize rank in format "{level}-{sequence}".
 * Level is a positive integer. Known levels (1-5) have display names:
 *   1 = 小獎, 2 = 中獎, 3 = 大獎, 4 = 特大獎, 5 = 頭獎
 * Sequence is a positive integer indicating order within the level.
 *
 * Immutable. Equality is based on value (level + sequence).
 */
export class PrizeRank {
	private constructor(
		public readonly level: number,
		public readonly sequence: number,
	) {}

	/**
	 * Creates a PrizeRank from a string in format "{level}-{sequence}".
	 *
	 * @throws InvalidPrizeRankFormatError if format is invalid
	 * @throws InvalidPrizeSequenceError if level or sequence is not positive
	 */
	static fromString(value: string): PrizeRank {
		const match = RANK_PATTERN.exec(value);
		if (!match) {
			throw new InvalidPrizeRankFormatError(value);
		}

		const level = parseInt(match[1], 10);
		const sequence = parseInt(match[2], 10);

		return PrizeRank.create(level, sequence);
	}

	/**
	 * Creates a PrizeRank from level and sequence numbers.
	 *
	 * @throws InvalidPrizeSequenceError if level or sequence is not positive
	 */
	static create(level: number, sequence: number): PrizeRank {
		if (level <= 0) {
			throw new InvalidPrizeSequenceError(level);
		}

		if (sequence <= 0) {
			throw new InvalidPrizeSequenceError(sequence);
		}

		return new PrizeRank(level, sequence);
	}

	/**
	 * Validates that ranks have consecutive sequences within each level.
	 * Sequences must be 1, 2, 3, ... (start from 1, no gaps).
	 *
	 * @throws NonConsecutiveSequenceError if any level has non-consecutive sequences
	 */
	static validateConsecutiveSequences(ranks: readonly PrizeRank[]): void {
		const byLevel = new Map<number, number[]>();
		for (const rank of ranks) {
			const sequences = byLevel.get(rank.level) ?? [];
			sequences.push(rank.sequence);
			byLevel.set(rank.level, sequences);
		}

		for (const [level, sequences] of byLevel) {
			const sorted = [...sequences].sort((a, b) => a - b);
			const isConsecutiveFromOne = sorted.every((seq, i) => seq === i + 1);
			if (!isConsecutiveFromOne) {
				throw new NonConsecutiveSequenceError(level, sorted);
			}
		}
	}

	toString(): string {
		return `${this.level}-${this.sequence}`;
	}

	/**
	 * Get the prize level display name (e.g., "小獎", "頭獎").
	 * Used in DTO layer for API responses.
	 */
	get levelName(): string {
		return PRIZE_LEVEL_NAMES[this.level] ?? `Level ${this.level}`;
	}

	equals(other: PrizeRank): boolean {
		return this.level === other.level && this.sequence === other.sequence;
	}

	/**
	 * Compare two PrizeRanks for sorting.
	 * Sorts by level first (ascending), then by sequence (ascending).
	 */
	compareTo(other: PrizeRank): number {
		if (this.level !== other.level) {
			return this.level - other.level;
		}
		return this.sequence - other.sequence;
	}
}
