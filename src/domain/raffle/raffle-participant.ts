import type { Employee } from '../employee';
import type { EmployeeRole } from '../shared';

export interface RaffleParticipantProps {
	id?: number;
	employeeId: number;
	staffNumber: string;
	name: string;
	department: string;
	role: EmployeeRole;
	attended?: boolean;
}

/**
 * Type representing a RaffleParticipant that has been persisted (has a valid id).
 * Used to ensure type safety when drawing winners.
 */
export type PersistedParticipant = RaffleParticipant & { readonly id: number };

/**
 * Entity: RaffleParticipant
 *
 * Belongs to Raffle aggregate.
 * Represents an Employee snapshot within a specific Raffle.
 *
 * - Snapshot fields are copied from Employee at creation time
 * - `attended` indicates presence (for prize collection purposes, not eligibility)
 */
export class RaffleParticipant {
	private constructor(
		public readonly id: number | null,
		public readonly employeeId: number,
		public readonly staffNumber: string,
		public readonly name: string,
		public readonly department: string,
		public readonly role: EmployeeRole,
		public readonly attended: boolean,
	) {}

	/**
	 * Creates a RaffleParticipant from persistence data (hydration).
	 */
	static create(props: RaffleParticipantProps): RaffleParticipant {
		return new RaffleParticipant(
			props.id ?? null,
			props.employeeId,
			props.staffNumber,
			props.name,
			props.department,
			props.role,
			props.attended ?? true,
		);
	}

	/**
	 * Creates a RaffleParticipant snapshot from an Employee.
	 * ID is null until persisted by Infrastructure layer.
	 */
	static fromEmployee(employee: Employee): RaffleParticipant {
		return new RaffleParticipant(
			null,
			employee.id,
			employee.staffNumber,
			employee.name,
			employee.department,
			employee.role,
			true,
		);
	}

	/**
	 * Returns a new instance with updated attended status.
	 */
	withAttended(attended: boolean): RaffleParticipant {
		return new RaffleParticipant(
			this.id,
			this.employeeId,
			this.staffNumber,
			this.name,
			this.department,
			this.role,
			attended,
		);
	}
}
