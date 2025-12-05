/**
 * RaffleParticipant entity tests.
 *
 * @see {@link RaffleParticipant}
 */
import { RaffleParticipant } from '../raffle';
import { EmployeeRole } from '../shared';

describe('RaffleParticipant', () => {
	const baseProps = {
		id: 1,
		employeeId: 100,
		staffNumber: 'EMP001',
		name: 'John Doe',
		department: 'Engineering',
		role: EmployeeRole.SENIOR,
	};

	describe('creation', () => {
		it('should create with correct snapshot fields', () => {
			const participant = RaffleParticipant.create(baseProps);

			expect(participant.id).toBe(1);
			expect(participant.employeeId).toBe(100);
			expect(participant.staffNumber).toBe('EMP001');
			expect(participant.name).toBe('John Doe');
			expect(participant.department).toBe('Engineering');
			expect(participant.role).toBe(EmployeeRole.SENIOR);
		});

		it('should default tags to empty array', () => {
			const participant = RaffleParticipant.create(baseProps);

			expect(participant.tags).toEqual([]);
		});

		it('should accept explicit tags value', () => {
			const participant = RaffleParticipant.create({
				...baseProps,
				tags: ['sick leave'],
			});

			expect(participant.tags).toEqual(['sick leave']);
		});
	});

	describe('fromEmployee', () => {
		it('should create snapshot from Employee with null id', () => {
			const employee = {
				id: 100,
				staffNumber: 'EMP001',
				name: 'John Doe',
				department: 'Engineering',
				role: EmployeeRole.SENIOR,
			};

			const participant = RaffleParticipant.fromEmployee(employee);

			expect(participant.id).toBeNull();
			expect(participant.employeeId).toBe(100);
			expect(participant.staffNumber).toBe('EMP001');
			expect(participant.name).toBe('John Doe');
			expect(participant.department).toBe('Engineering');
			expect(participant.role).toBe(EmployeeRole.SENIOR);
			expect(participant.tags).toEqual([]);
		});
	});
});
