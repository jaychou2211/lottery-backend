/**
 * Default random lottery implementation tests.
 *
 * @see {@link randomLottery}
 */
import { randomLottery } from '../raffle';
import { fakeParticipant, RegularEligibleCounts, BonusEligibleCounts, EmployeeRole, DrawnGroup } from './factories';

describe('randomLottery', () => {
	describe('regular prizes (grouped drawing)', () => {
		it('should draw correct number of seniors and juniors', () => {
			const candidates = [
				fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
				fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.SENIOR }),
				fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.JUNIOR }),
				fakeParticipant({ id: 4, employeeId: 400, role: EmployeeRole.JUNIOR }),
			];
			const eligibleCounts = RegularEligibleCounts.create(2, 1);

			const result = randomLottery(candidates, eligibleCounts);

			const seniors = result.filter((w) => w.drawnGroup === DrawnGroup.SENIOR);
			const juniors = result.filter((w) => w.drawnGroup === DrawnGroup.JUNIOR);

			expect(seniors).toHaveLength(2);
			expect(juniors).toHaveLength(1);
		});

		it('should only select from correct role pools', () => {
			const seniorParticipants = [
				fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
				fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.SENIOR }),
			];
			const juniorParticipants = [
				fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.JUNIOR }),
				fakeParticipant({ id: 4, employeeId: 400, role: EmployeeRole.JUNIOR }),
			];
			const candidates = [...seniorParticipants, ...juniorParticipants];
			const eligibleCounts = RegularEligibleCounts.create(1, 1);

			const result = randomLottery(candidates, eligibleCounts);

			const seniorWinners = result.filter((w) => w.drawnGroup === DrawnGroup.SENIOR);
			const juniorWinners = result.filter((w) => w.drawnGroup === DrawnGroup.JUNIOR);

			// Senior winners should have participantId 1 or 2
			expect(seniorWinners.every((w) => [1, 2].includes(w.participantId))).toBe(true);
			// Junior winners should have participantId 3 or 4
			expect(juniorWinners.every((w) => [3, 4].includes(w.participantId))).toBe(true);
		});
	});

	describe('bonus prizes (all pool drawing)', () => {
		it('should draw from all candidates regardless of role', () => {
			const candidates = [
				fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
				fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
				fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.SENIOR }),
			];
			const eligibleCounts = BonusEligibleCounts.create(2);

			const result = randomLottery(candidates, eligibleCounts);

			expect(result).toHaveLength(2);
			expect(result.every((w) => w.drawnGroup === DrawnGroup.ALL)).toBe(true);
		});
	});

	describe('randomness', () => {
		it('should not always return the same order (statistical test)', () => {
			const candidates = Array.from({ length: 10 }, (_, i) =>
				fakeParticipant({ id: i + 1, employeeId: (i + 1) * 100, role: EmployeeRole.SENIOR }),
			);
			const eligibleCounts = RegularEligibleCounts.create(5, 0);

			// Run multiple times and check that results vary
			const results = new Set<string>();
			for (let i = 0; i < 20; i++) {
				const winners = randomLottery(candidates, eligibleCounts);
				const key = winners.map((w) => w.participantId).join(',');
				results.add(key);
			}

			// With 10 candidates choosing 5, there should be variation
			// (This test could theoretically fail but probability is negligible)
			expect(results.size).toBeGreaterThan(1);
		});
	});
});
