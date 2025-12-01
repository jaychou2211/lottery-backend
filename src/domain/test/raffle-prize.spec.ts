/**
 * RafflePrize entity tests.
 *
 * @see {@link RafflePrize}
 */
import { InvalidPrizeRankError, EmptyPrizeNameError, RafflePrize } from '../raffle';
import { fakePrize, fakeBonusPrize, RegularEligibleCounts, BonusEligibleCounts } from './factories';

describe('RafflePrize', () => {
	describe('creation', () => {
		it('should create with isDrawn defaulting to false', () => {
			const prize = fakePrize();

			expect(prize.isDrawn).toBe(false);
		});

		it('should create with id defaulting to null when not provided', () => {
			const prize = RafflePrize.create({
				rank: 1,
				name: 'Test',
				prizeLevel: 'Gold',
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
		it.each([0, -1, -100])('should throw InvalidPrizeRankError when rank is %d', (rank) => {
			expect(() => fakePrize({ rank })).toThrow(InvalidPrizeRankError);
		});

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
			const prize = fakePrize({ id: 42, rank: 3, name: 'Test Prize' });

			const drawn = prize.markAsDrawn();

			expect(drawn.id).toBe(42);
			expect(drawn.rank).toBe(3);
			expect(drawn.name).toBe('Test Prize');
		});
	});

	describe('isBonus', () => {
		it('should return false for regular prize', () => {
			const prize = fakePrize({
				eligibleCounts: RegularEligibleCounts.create(4, 2),
			});

			expect(prize.isBonus()).toBe(false);
		});

		it('should return true for bonus prize', () => {
			const prize = fakeBonusPrize({
				eligibleCounts: BonusEligibleCounts.create(5),
			});

			expect(prize.isBonus()).toBe(true);
		});
	});
});
