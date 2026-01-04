/**
 * EligibleCounts Value Object tests.
 *
 * @see {@link EligibleCounts}
 */
import { RegularEligibleCounts, BonusEligibleCounts } from './factories';
import { InvalidTotalError, TotalMismatchError } from '../shared';

describe('RegularEligibleCounts', () => {
	describe('create', () => {
		it('should create with senior + junior = total', () => {
			const counts = RegularEligibleCounts.create(4, 2);

			expect(counts.total).toBe(6);
			expect(counts.senior).toBe(4);
			expect(counts.junior).toBe(2);
			expect(counts.isBonus()).toBe(false);
			expect(counts.isRegular()).toBe(true);
		});

		it('should allow zero senior or junior count', () => {
			const seniorOnly = RegularEligibleCounts.create(3, 0);
			const juniorOnly = RegularEligibleCounts.create(0, 2);

			expect(seniorOnly.senior).toBe(3);
			expect(seniorOnly.junior).toBe(0);
			expect(juniorOnly.senior).toBe(0);
			expect(juniorOnly.junior).toBe(2);
		});

		it('should throw InvalidTotalError when senior + junior = 0', () => {
			expect(() => RegularEligibleCounts.create(0, 0)).toThrow(InvalidTotalError);
		});
	});

	describe('hydrate', () => {
		it('should hydrate valid data', () => {
			const counts = RegularEligibleCounts.hydrate(6, 4, 2);

			expect(counts.total).toBe(6);
			expect(counts.senior).toBe(4);
			expect(counts.junior).toBe(2);
		});

		it('should throw TotalMismatchError when total !== senior + junior', () => {
			expect(() => RegularEligibleCounts.hydrate(6, 4, 3)).toThrow(TotalMismatchError);
		});

		it('should throw InvalidTotalError when total <= 0', () => {
			expect(() => RegularEligibleCounts.hydrate(0, 0, 0)).toThrow(InvalidTotalError);
		});
	});

	describe('equality', () => {
		it('should be equal when values are the same', () => {
			const a = RegularEligibleCounts.create(4, 2);
			const b = RegularEligibleCounts.create(4, 2);

			expect(a.equals(b)).toBe(true);
		});

		it('should not be equal when values differ', () => {
			const a = RegularEligibleCounts.create(4, 2);
			const b = RegularEligibleCounts.create(3, 3);

			expect(a.equals(b)).toBe(false);
		});
	});
});

describe('BonusEligibleCounts', () => {
	describe('create', () => {
		it('should create bonus counts', () => {
			const counts = BonusEligibleCounts.create(5);

			expect(counts.total).toBe(5);
			expect(counts.isBonus()).toBe(true);
			expect(counts.isRegular()).toBe(false);
		});

		it.each([0, -1])('should throw InvalidTotalError when total is %d', (total) => {
			expect(() => BonusEligibleCounts.create(total)).toThrow(InvalidTotalError);
		});
	});

	describe('equality', () => {
		it('should be equal when totals are the same', () => {
			const a = BonusEligibleCounts.create(5);
			const b = BonusEligibleCounts.create(5);

			expect(a.equals(b)).toBe(true);
		});

		it('should not be equal when totals differ', () => {
			const a = BonusEligibleCounts.create(5);
			const b = BonusEligibleCounts.create(3);

			expect(a.equals(b)).toBe(false);
		});
	});
});

describe('EligibleCounts discriminated union', () => {
	it('should distinguish regular from bonus with same total', () => {
		const regular = RegularEligibleCounts.create(3, 2);
		const bonus = BonusEligibleCounts.create(5);

		expect(regular.equals(bonus)).toBe(false);
		expect(bonus.equals(regular)).toBe(false);
	});
});
