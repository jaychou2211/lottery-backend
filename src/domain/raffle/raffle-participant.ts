import type { Employee } from '../employee';
import type { EmployeeRole } from '../shared';

export interface RaffleParticipantProps {
	id?: number;
	employeeId: number;
	staffNumber: string;
	name: string;
	department: string;
	role: EmployeeRole;
	tags?: readonly string[];
}

/**
 * Type representing a RaffleParticipant that has been persisted (has a valid id).
 * Used to ensure type safety when drawing winners.
 */
export type PersistedParticipant = RaffleParticipant & { readonly id: number };

export class RaffleParticipant {
	private constructor(
		public readonly id: number | null,
		public readonly employeeId: number,
		public readonly staffNumber: string,
		public readonly name: string,
		public readonly department: string,
		public readonly role: EmployeeRole,
		public readonly tags: readonly string[],
	) {}

	static create(props: RaffleParticipantProps): RaffleParticipant {
		return new RaffleParticipant(
			props.id ?? null,
			props.employeeId,
			props.staffNumber,
			props.name,
			props.department,
			props.role,
			props.tags ?? [],
		);
	}

	static fromEmployee(employee: Employee): RaffleParticipant {
		return new RaffleParticipant(
			null,
			employee.id,
			employee.staffNumber,
			employee.name,
			employee.department,
			employee.role,
			[],
		);
	}
}
