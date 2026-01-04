/**
 * EligibilityPool Value Object tests.
 *
 * @see {@link EligibilityPool}
 */
import { EligibilityPool } from '../raffle';
import { EmployeeRole, DrawnGroup } from '../shared';

describe('EligibilityPool', () => {
	describe('create', () => {
		it('should separate participants by role', () => {
			const seniorIds = [1, 2];
			const juniorIds = [3, 4, 5];
			const participants = [
				...seniorIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
				...juniorIds.map((id) => ({ id, role: EmployeeRole.JUNIOR })),
			];

			const pool = EligibilityPool.create(participants);

			expect(pool.seniorCount).toBe(seniorIds.length);
			expect(pool.juniorCount).toBe(juniorIds.length);
		});

		it('should handle empty participants', () => {
			const pool = EligibilityPool.create([]);

			expect(pool.totalCount).toBe(0);
			expect(pool.seniorCount).toBe(0);
			expect(pool.juniorCount).toBe(0);
		});

		it('should accept pre-existing wonIds', () => {
			const allIds = [1, 2, 3];
			const alreadyWonIds = new Set([1, 2]);
			const participants = allIds.map((id) => ({ id, role: EmployeeRole.SENIOR }));

			const pool = EligibilityPool.create(participants, alreadyWonIds);

			expect(pool.wonIds).toEqual(alreadyWonIds);
			expect(pool.remainingSeniorCount).toBe(allIds.length - alreadyWonIds.size);
		});
	});

	describe('counts', () => {
		it('should calculate totalCount as sum of seniors and juniors', () => {
			const seniorCount = 3;
			const juniorCount = 2;
			const participants = [
				...Array.from({ length: seniorCount }, (_, i) => ({ id: i + 1, role: EmployeeRole.SENIOR })),
				...Array.from({ length: juniorCount }, (_, i) => ({ id: i + 100, role: EmployeeRole.JUNIOR })),
			];

			const pool = EligibilityPool.create(participants);

			expect(pool.totalCount).toBe(seniorCount + juniorCount);
		});

		it('should calculate remainingCounts excluding wonIds', () => {
			const seniorIds = [1, 2, 3];
			const juniorIds = [4, 5];
			const wonSeniorIds = [1];
			const wonJuniorIds = [4];
			const participants = [
				...seniorIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
				...juniorIds.map((id) => ({ id, role: EmployeeRole.JUNIOR })),
			];

			const pool = EligibilityPool.create(participants, new Set([...wonSeniorIds, ...wonJuniorIds]));

			expect(pool.remainingSeniorCount).toBe(seniorIds.length - wonSeniorIds.length);
			expect(pool.remainingJuniorCount).toBe(juniorIds.length - wonJuniorIds.length);
			expect(pool.remainingTotalCount).toBe(
				seniorIds.length - wonSeniorIds.length + juniorIds.length - wonJuniorIds.length,
			);
		});
	});

	describe('hasWon', () => {
		it('should return false for participant not in wonIds', () => {
			const notWonId = 1;
			const pool = EligibilityPool.create([{ id: notWonId, role: EmployeeRole.SENIOR }]);

			expect(pool.hasWon(notWonId)).toBe(false);
		});

		it('should return true for participant in wonIds', () => {
			const wonId = 1;
			const pool = EligibilityPool.create(
				[{ id: wonId, role: EmployeeRole.SENIOR }],
				new Set([wonId]),
			);

			expect(pool.hasWon(wonId)).toBe(true);
		});
	});

	describe('getEligibleIds', () => {
		it('should return only non-won seniors for DrawnGroup.SENIOR', () => {
			const eligibleSeniorIds = [1, 2];
			const wonSeniorId = 3;
			const juniorIds = [4, 5];
			const participants = [
				...eligibleSeniorIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
				{ id: wonSeniorId, role: EmployeeRole.SENIOR },
				...juniorIds.map((id) => ({ id, role: EmployeeRole.JUNIOR })),
			];

			const pool = EligibilityPool.create(participants, new Set([wonSeniorId]));
			const result = pool.getEligibleIds(DrawnGroup.SENIOR);

			expect(result).toHaveLength(eligibleSeniorIds.length);
			expect(result).toEqual(expect.arrayContaining(eligibleSeniorIds));
			expect(result).not.toContain(wonSeniorId);
			juniorIds.forEach((id) => expect(result).not.toContain(id));
		});

		it('should return only non-won juniors for DrawnGroup.JUNIOR', () => {
			const seniorIds = [1, 2];
			const eligibleJuniorIds = [3, 4];
			const wonJuniorId = 5;
			const participants = [
				...seniorIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
				...eligibleJuniorIds.map((id) => ({ id, role: EmployeeRole.JUNIOR })),
				{ id: wonJuniorId, role: EmployeeRole.JUNIOR },
			];

			const pool = EligibilityPool.create(participants, new Set([wonJuniorId]));
			const result = pool.getEligibleIds(DrawnGroup.JUNIOR);

			expect(result).toHaveLength(eligibleJuniorIds.length);
			expect(result).toEqual(expect.arrayContaining(eligibleJuniorIds));
			expect(result).not.toContain(wonJuniorId);
			seniorIds.forEach((id) => expect(result).not.toContain(id));
		});

		it('should return all non-won participants for DrawnGroup.ALL', () => {
			const eligibleSeniorIds = [1, 2];
			const eligibleJuniorIds = [3, 4];
			const wonIds = [5, 6];
			const participants = [
				...eligibleSeniorIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
				...eligibleJuniorIds.map((id) => ({ id, role: EmployeeRole.JUNIOR })),
				...wonIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
			];

			const pool = EligibilityPool.create(participants, new Set(wonIds));
			const result = pool.getEligibleIds(DrawnGroup.ALL);

			const allEligibleIds = [...eligibleSeniorIds, ...eligibleJuniorIds];
			expect(result).toHaveLength(allEligibleIds.length);
			expect(result).toEqual(expect.arrayContaining(allEligibleIds));
			wonIds.forEach((id) => expect(result).not.toContain(id));
		});
	});

	describe('getRole', () => {
		it('should return SENIOR for senior participant', () => {
			const seniorId = 1;
			const pool = EligibilityPool.create([{ id: seniorId, role: EmployeeRole.SENIOR }]);

			expect(pool.getRole(seniorId)).toBe(EmployeeRole.SENIOR);
		});

		it('should return JUNIOR for junior participant', () => {
			const juniorId = 1;
			const pool = EligibilityPool.create([{ id: juniorId, role: EmployeeRole.JUNIOR }]);

			expect(pool.getRole(juniorId)).toBe(EmployeeRole.JUNIOR);
		});

		it('should return undefined for unknown participant', () => {
			const unknownId = 999;
			const pool = EligibilityPool.create([{ id: 1, role: EmployeeRole.SENIOR }]);

			expect(pool.getRole(unknownId)).toBeUndefined();
		});
	});

	describe('markAsWon', () => {
		it('should return new instance with participant marked as won', () => {
			const participantId = 1;
			const original = EligibilityPool.create([{ id: participantId, role: EmployeeRole.SENIOR }]);

			const updated = original.markAsWon(participantId);

			expect(updated.hasWon(participantId)).toBe(true);
			expect(original.hasWon(participantId)).toBe(false);
		});

		it('should preserve existing wonIds', () => {
			const previouslyWonId = 1;
			const newlyWonId = 2;
			const original = EligibilityPool.create(
				[
					{ id: previouslyWonId, role: EmployeeRole.SENIOR },
					{ id: newlyWonId, role: EmployeeRole.SENIOR },
				],
				new Set([previouslyWonId]),
			);

			const updated = original.markAsWon(newlyWonId);

			expect(updated.hasWon(previouslyWonId)).toBe(true);
			expect(updated.hasWon(newlyWonId)).toBe(true);
		});
	});

	describe('markManyAsWon', () => {
		it('should mark multiple participants as won in single operation', () => {
			const idsToMark = [1, 2, 3];
			const original = EligibilityPool.create(
				idsToMark.map((id) => ({ id, role: EmployeeRole.SENIOR })),
			);

			const updated = original.markManyAsWon(idsToMark);

			idsToMark.forEach((id) => {
				expect(updated.hasWon(id)).toBe(true);
				expect(original.hasWon(id)).toBe(false);
			});
		});

		it('should handle empty array', () => {
			const participantId = 1;
			const original = EligibilityPool.create([{ id: participantId, role: EmployeeRole.SENIOR }]);

			const updated = original.markManyAsWon([]);

			expect(updated.hasWon(participantId)).toBe(false);
			expect(updated.remainingTotalCount).toBe(original.remainingTotalCount);
		});
	});
});
