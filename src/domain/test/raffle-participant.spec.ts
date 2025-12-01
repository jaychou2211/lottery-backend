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

		it('should default attended to true', () => {
			const participant = RaffleParticipant.create(baseProps);

			expect(participant.attended).toBe(true);
		});

		it('should accept explicit attended value', () => {
			const participant = RaffleParticipant.create({
				...baseProps,
				attended: false,
			});

			expect(participant.attended).toBe(false);
		});
	});

	describe('withAttended', () => {
		it('should return new instance with updated attended', () => {
			const participant = RaffleParticipant.create(baseProps);

			const updated = participant.withAttended(false);

			expect(updated.attended).toBe(false);
			expect(participant.attended).toBe(true); // immutable
		});

		it('should preserve all other properties', () => {
			const participant = RaffleParticipant.create(baseProps);

			const updated = participant.withAttended(false);

			expect(updated.id).toBe(participant.id);
			expect(updated.employeeId).toBe(participant.employeeId);
			expect(updated.staffNumber).toBe(participant.staffNumber);
			expect(updated.name).toBe(participant.name);
			expect(updated.department).toBe(participant.department);
			expect(updated.role).toBe(participant.role);
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
			expect(participant.attended).toBe(true);
		});
	});
});
