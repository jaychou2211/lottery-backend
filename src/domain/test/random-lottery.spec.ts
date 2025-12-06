/**
 * Default random lottery implementation tests.
 *
 * @see {@link randomLottery}
 */
import { randomLottery, EligibilityPool } from '../raffle';
import { RegularEligibleCounts, BonusEligibleCounts, EmployeeRole, DrawnGroup } from './factories';

describe('randomLottery', () => {
	describe('regular prizes (grouped drawing)', () => {
		it('should draw exact number of seniors and juniors as specified', () => {
			const seniorIds = [1, 2, 3];
			const juniorIds = [4, 5, 6];
			const pool = EligibilityPool.create([
				...seniorIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
				...juniorIds.map((id) => ({ id, role: EmployeeRole.JUNIOR })),
			]);

			const requiredSeniors = 2;
			const requiredJuniors = 1;
			const eligibleCounts = RegularEligibleCounts.create(requiredSeniors, requiredJuniors);

			const result = randomLottery(pool, eligibleCounts);

			const seniorWinners = result.filter((w) => w.drawnGroup === DrawnGroup.SENIOR);
			const juniorWinners = result.filter((w) => w.drawnGroup === DrawnGroup.JUNIOR);

			expect(seniorWinners).toHaveLength(requiredSeniors);
			expect(juniorWinners).toHaveLength(requiredJuniors);
		});

		it('should only select seniors from senior pool and juniors from junior pool', () => {
			const seniorIds = [1, 2];
			const juniorIds = [3, 4];
			const pool = EligibilityPool.create([
				...seniorIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
				...juniorIds.map((id) => ({ id, role: EmployeeRole.JUNIOR })),
			]);
			const eligibleCounts = RegularEligibleCounts.create(1, 1);

			const result = randomLottery(pool, eligibleCounts);

			const seniorWinners = result.filter((w) => w.drawnGroup === DrawnGroup.SENIOR);
			const juniorWinners = result.filter((w) => w.drawnGroup === DrawnGroup.JUNIOR);

			expect(seniorWinners.every((w) => seniorIds.includes(w.participantId))).toBe(true);
			expect(juniorWinners.every((w) => juniorIds.includes(w.participantId))).toBe(true);
		});

		it('should handle zero senior requirement (juniors only)', () => {
			const seniorIds = [1, 2];
			const juniorIds = [3, 4, 5];
			const pool = EligibilityPool.create([
				...seniorIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
				...juniorIds.map((id) => ({ id, role: EmployeeRole.JUNIOR })),
			]);

			const requiredSeniors = 0;
			const requiredJuniors = 2;
			const eligibleCounts = RegularEligibleCounts.create(requiredSeniors, requiredJuniors);

			const result = randomLottery(pool, eligibleCounts);

			const seniorWinners = result.filter((w) => w.drawnGroup === DrawnGroup.SENIOR);
			const juniorWinners = result.filter((w) => w.drawnGroup === DrawnGroup.JUNIOR);

			expect(seniorWinners).toHaveLength(requiredSeniors);
			expect(juniorWinners).toHaveLength(requiredJuniors);
			expect(juniorWinners.every((w) => juniorIds.includes(w.participantId))).toBe(true);
		});

		it('should handle zero junior requirement (seniors only)', () => {
			const seniorIds = [1, 2, 3];
			const juniorIds = [4, 5];
			const pool = EligibilityPool.create([
				...seniorIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
				...juniorIds.map((id) => ({ id, role: EmployeeRole.JUNIOR })),
			]);

			const requiredSeniors = 2;
			const requiredJuniors = 0;
			const eligibleCounts = RegularEligibleCounts.create(requiredSeniors, requiredJuniors);

			const result = randomLottery(pool, eligibleCounts);

			const seniorWinners = result.filter((w) => w.drawnGroup === DrawnGroup.SENIOR);
			const juniorWinners = result.filter((w) => w.drawnGroup === DrawnGroup.JUNIOR);

			expect(seniorWinners).toHaveLength(requiredSeniors);
			expect(juniorWinners).toHaveLength(requiredJuniors);
			expect(seniorWinners.every((w) => seniorIds.includes(w.participantId))).toBe(true);
		});

		it('should handle drawing all available participants (exact match)', () => {
			const seniorIds = [1, 2];
			const juniorIds = [3];
			const pool = EligibilityPool.create([
				...seniorIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
				...juniorIds.map((id) => ({ id, role: EmployeeRole.JUNIOR })),
			]);

			const requiredSeniors = seniorIds.length;
			const requiredJuniors = juniorIds.length;
			const eligibleCounts = RegularEligibleCounts.create(requiredSeniors, requiredJuniors);

			const result = randomLottery(pool, eligibleCounts);

			const winnerIds = result.map((w) => w.participantId).sort();
			const allIds = [...seniorIds, ...juniorIds].sort();

			expect(winnerIds).toEqual(allIds);
		});
	});

	describe('bonus prizes (all pool drawing)', () => {
		it('should draw from all candidates regardless of role', () => {
			const allIds = [1, 2, 3, 4, 5];
			const pool = EligibilityPool.create([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.JUNIOR },
				{ id: 3, role: EmployeeRole.SENIOR },
				{ id: 4, role: EmployeeRole.JUNIOR },
				{ id: 5, role: EmployeeRole.SENIOR },
			]);

			const requiredTotal = 3;
			const eligibleCounts = BonusEligibleCounts.create(requiredTotal);

			const result = randomLottery(pool, eligibleCounts);

			expect(result).toHaveLength(requiredTotal);
			expect(result.every((w) => w.drawnGroup === DrawnGroup.ALL)).toBe(true);
			expect(result.every((w) => allIds.includes(w.participantId))).toBe(true);
		});

		it('should handle drawing all remaining participants for bonus', () => {
			const allIds = [1, 2, 3];
			const pool = EligibilityPool.create(
				allIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
			);

			const requiredTotal = allIds.length;
			const eligibleCounts = BonusEligibleCounts.create(requiredTotal);

			const result = randomLottery(pool, eligibleCounts);

			const winnerIds = result.map((w) => w.participantId).sort();
			expect(winnerIds).toEqual(allIds.sort());
		});
	});

	describe('wonIds exclusion', () => {
		it('should exclude already-won participants from selection', () => {
			const eligibleIds = [1, 2];
			const alreadyWonIds = [3, 4];
			const pool = EligibilityPool.create(
				[...eligibleIds, ...alreadyWonIds].map((id) => ({ id, role: EmployeeRole.SENIOR })),
				new Set(alreadyWonIds),
			);

			const eligibleCounts = RegularEligibleCounts.create(2, 0);

			const result = randomLottery(pool, eligibleCounts);

			const winnerIds = result.map((w) => w.participantId);
			expect(winnerIds).toEqual(expect.arrayContaining(eligibleIds));
			alreadyWonIds.forEach((wonId) => {
				expect(winnerIds).not.toContain(wonId);
			});
		});

		it('should exclude won participants in bonus drawing', () => {
			const eligibleIds = [1, 2];
			const alreadyWonId = 3;
			const pool = EligibilityPool.create(
				[...eligibleIds, alreadyWonId].map((id) => ({ id, role: EmployeeRole.SENIOR })),
				new Set([alreadyWonId]),
			);

			const eligibleCounts = BonusEligibleCounts.create(2);

			const result = randomLottery(pool, eligibleCounts);

			const winnerIds = result.map((w) => w.participantId);
			expect(winnerIds).toEqual(expect.arrayContaining(eligibleIds));
			expect(winnerIds).not.toContain(alreadyWonId);
		});
	});

	describe('randomness verification', () => {
		it('should produce varied results across multiple runs', () => {
			const candidateCount = 10;
			const selectCount = 5;
			const pool = EligibilityPool.create(
				Array.from({ length: candidateCount }, (_, i) => ({ id: i + 1, role: EmployeeRole.SENIOR })),
			);
			const eligibleCounts = RegularEligibleCounts.create(selectCount, 0);

			const uniqueResults = new Set<string>();
			const iterations = 20;

			for (let i = 0; i < iterations; i++) {
				const winners = randomLottery(pool, eligibleCounts);
				const resultKey = winners.map((w) => w.participantId).sort().join(',');
				uniqueResults.add(resultKey);
			}

			// With C(10,5)=252 combinations, getting duplicates in 20 runs is unlikely
			expect(uniqueResults.size).toBeGreaterThan(1);
		});
	});
});
