import type { EmployeeRole } from './shared';

/**
 * Entity: Employee
 *
 * Reference entity shared across raffles.
 * Identity is determined by `id`, not by attributes.
 *
 * Note: This is intentionally an interface, not a class.
 * Employee has no domain behavior in this bounded context;
 * it serves as reference data for lottery operations.
 * CRUD operations are handled in the Application layer.
 */
export interface Employee {
	readonly id: number;
	readonly staffNumber: string;
	readonly name: string;
	readonly department: string;
	readonly role: EmployeeRole;
}
