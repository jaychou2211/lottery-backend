import { ApiProperty } from '@nestjs/swagger';

import { EmployeeRole } from '../../domain/shared';

/**
 * Represents a single row from the employee CSV file.
 */
export interface EmployeeCsvRow {
	staffNumber: string;
	name: string;
	department: string;
	role: EmployeeRole;
}

/**
 * Response DTO for the sync operation result.
 */
export class SyncResultDto {
	@ApiProperty({ description: 'Number of employees created' })
	created: number;

	@ApiProperty({ description: 'Number of employees updated' })
	updated: number;

	@ApiProperty({ description: 'Number of employees deleted' })
	deleted: number;

	@ApiProperty({ description: 'Total number of employees after sync' })
	total: number;
}
