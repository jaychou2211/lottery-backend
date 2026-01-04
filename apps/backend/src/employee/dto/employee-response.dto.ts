import { ApiProperty } from '@nestjs/swagger';

import { EmployeeRole } from '../../domain/shared';

export class EmployeeResponseDto {
	id: number;

	staffNumber: string;

	name: string;

	department: string;

	@ApiProperty({ enum: EmployeeRole })
	role: EmployeeRole;
}
