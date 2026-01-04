import {
	PrizeRank,
	InvalidPrizeSequenceError,
	NonConsecutiveSequenceError,
} from '../shared/prize-rank';

describe('PrizeRank', () => {
	describe('fromString', () => {
		it('should parse valid rank string', () => {
			const rank = PrizeRank.fromString('3-15');
			expect(rank.level).toBe(3);
			expect(rank.sequence).toBe(15);
		});

		it.each(['invalid', '1', '1-', '-1', '1-1-1', 'a-b', '1.1', '', '0-1', '1-0', '1--1', '-1-1'])(
			'should throw for invalid input "%s"',
			(value) => {
				expect(() => PrizeRank.fromString(value)).toThrow();
			},
		);
	});

	describe('create', () => {
		it('should create with positive level and sequence', () => {
			const rank = PrizeRank.create(5, 100);
			expect(rank.level).toBe(5);
			expect(rank.sequence).toBe(100);
		});

		it.each([
			[0, 1],
			[-1, 1],
			[1, 0],
			[1, -1],
		])('should throw InvalidPrizeSequenceError for (%d, %d)', (level, sequence) => {
			expect(() => PrizeRank.create(level, sequence)).toThrow(InvalidPrizeSequenceError);
		});
	});

	describe('toString', () => {
		it('should return "{level}-{sequence}" format', () => {
			expect(PrizeRank.create(1, 5).toString()).toBe('1-5');
		});
	});

	describe('equals', () => {
		it('should compare by value', () => {
			expect(PrizeRank.create(2, 3).equals(PrizeRank.create(2, 3))).toBe(true);
			expect(PrizeRank.create(1, 1).equals(PrizeRank.create(2, 1))).toBe(false);
			expect(PrizeRank.create(1, 1).equals(PrizeRank.create(1, 2))).toBe(false);
		});
	});

	describe('compareTo', () => {
		it('should sort by level first, then sequence', () => {
			const ranks = [
				PrizeRank.create(2, 1),
				PrizeRank.create(1, 2),
				PrizeRank.create(1, 1),
			];
			const sorted = [...ranks].sort((a, b) => a.compareTo(b));
			expect(sorted.map((r) => r.toString())).toEqual(['1-1', '1-2', '2-1']);
		});
	});

	describe('levelName', () => {
		it.each([
			[1, '小獎'],
			[2, '中獎'],
			[3, '大獎'],
			[4, '特大獎'],
			[5, '頭獎'],
			[6, 'Level 6'],
		])('level %d should return "%s"', (level, expected) => {
			expect(PrizeRank.create(level, 1).levelName).toBe(expected);
		});
	});

	describe('validateConsecutiveSequences', () => {
		it('should accept consecutive sequences starting from 1', () => {
			const ranks = [
				PrizeRank.create(1, 3),
				PrizeRank.create(1, 1),
				PrizeRank.create(1, 2),
				PrizeRank.create(2, 1),
			];
			expect(() => PrizeRank.validateConsecutiveSequences(ranks)).not.toThrow();
		});

		it('should throw NonConsecutiveSequenceError for gaps or not starting from 1', () => {
			// gap: 1, 2, 4
			expect(() =>
				PrizeRank.validateConsecutiveSequences([
					PrizeRank.create(1, 1),
					PrizeRank.create(1, 2),
					PrizeRank.create(1, 4),
				]),
			).toThrow(NonConsecutiveSequenceError);

			// not starting from 1
			expect(() =>
				PrizeRank.validateConsecutiveSequences([
					PrizeRank.create(1, 2),
					PrizeRank.create(1, 3),
				]),
			).toThrow(NonConsecutiveSequenceError);
		});

		it('should validate each level independently', () => {
			expect(() =>
				PrizeRank.validateConsecutiveSequences([
					PrizeRank.create(1, 1),
					PrizeRank.create(1, 2),
					PrizeRank.create(2, 1),
					PrizeRank.create(2, 3), // gap in level 2
				]),
			).toThrow(NonConsecutiveSequenceError);
		});
	});
});
