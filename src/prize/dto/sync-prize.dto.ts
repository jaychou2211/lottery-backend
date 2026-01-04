import { ApiProperty } from '@nestjs/swagger';

/**
 * Represents a single row from the prize CSV file.
 * Used internally for sync operations.
 */
export interface PrizeCsvRow {
	name: string;
	/** Prize rank in format "{level}-{sequence}" (e.g., "1-1", "2-3", "5-1") */
	rank: string;
	imageUrl: string;
	/** Number of senior winners */
	senior: number;
	/** Number of junior winners */
	junior: number;
}

/**
 * Response DTO for prize sync operation.
 */
export class PrizeSyncResultDto {
	@ApiProperty({ description: 'Number of prizes created', example: 5 })
	created: number;

	@ApiProperty({ description: 'Number of prizes updated', example: 3 })
	updated: number;

	@ApiProperty({ description: 'Number of prizes deleted', example: 2 })
	deleted: number;

	@ApiProperty({ description: 'Total number of active prizes after sync', example: 8 })
	total: number;
}
