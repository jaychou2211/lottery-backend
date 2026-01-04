import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard error response format for API errors.
 * Used for Swagger documentation of error responses.
 */
export class ErrorResponseDto {
	@ApiProperty({ example: 400, description: 'HTTP status code' })
	statusCode: number;

	@ApiProperty({ example: 'INVALID_STATUS_TRANSITION', description: 'Error code for client-side handling' })
	code: string;

	@ApiProperty({ example: 'cannot transition from DRAFT to COMPLETED', description: 'Human-readable error message' })
	message: string;
}
