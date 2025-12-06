/**
 * Prize entity tests.
 *
 * @see {@link Prize}
 */
import { EmptyPrizeNameError, Prize } from '../raffle';
import { fakePrize, RegularEligibleCounts, PrizeRank } from './factories';

describe('Prize', () => {
	describe('creation', () => {
		it('should create with isDrawn defaulting to false', () => {
			const prize = fakePrize();

			expect(prize.isDrawn).toBe(false);
		});

		it('should create with id defaulting to null when not provided', () => {
			const prize = Prize.create({
				rank: PrizeRank.create(1, 1),
				name: 'Test',
				eligibleCounts: RegularEligibleCounts.create(2, 1),
				imageUrl: 'http://example.com/image.png',
			});

			expect(prize.id).toBeNull();
		});

		it('should accept provided id', () => {
			const prize = fakePrize({ id: 42 });

			expect(prize.id).toBe(42);
		});
	});

	describe('validation', () => {
		it.each(['', '   ', '\t\n'])('should throw EmptyPrizeNameError when name is "%s"', (name) => {
			expect(() => fakePrize({ name })).toThrow(EmptyPrizeNameError);
		});
	});

	describe('markAsDrawn', () => {
		it('should return new instance with isDrawn=true', () => {
			const prize = fakePrize();

			const drawn = prize.markAsDrawn();

			expect(drawn.isDrawn).toBe(true);
			expect(prize.isDrawn).toBe(false); // immutable
		});

		it('should preserve all other properties', () => {
			const rank = PrizeRank.create(2, 3);
			const prize = fakePrize({ id: 42, rank, name: 'Test Prize' });

			const drawn = prize.markAsDrawn();

			expect(drawn.id).toBe(42);
			expect(drawn.rank.equals(rank)).toBe(true);
			expect(drawn.name).toBe('Test Prize');
		});
	});

	describe('withRank', () => {
		it('should return new instance with updated rank', () => {
			const originalRank = PrizeRank.create(1, 1);
			const newRank = PrizeRank.create(2, 5);
			const prize = fakePrize({ rank: originalRank });

			const updated = prize.withRank(newRank);

			expect(updated.rank.equals(newRank)).toBe(true);
			expect(prize.rank.equals(originalRank)).toBe(true); // immutable
		});

		it('should preserve all other properties', () => {
			const prize = fakePrize({ id: 42, name: 'Test Prize' });

			const updated = prize.withRank(PrizeRank.create(3, 1));

			expect(updated.id).toBe(42);
			expect(updated.name).toBe('Test Prize');
			expect(updated.isDrawn).toBe(prize.isDrawn);
		});
	});

	// Note: isBonus() and isRegular() are pure delegates to EligibleCounts.
	// See eligible-counts.spec.ts for comprehensive tests.
});
