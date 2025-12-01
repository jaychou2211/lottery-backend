import { IsEnum, IsOptional, MaxLength } from 'class-validator';

import { EmployeeRole } from '../../domain/shared';

export class UpdateEmployeeDto {
	/** Employee staff number (unique identifier) */
	@IsOptional()
	@MaxLength(50)
	staffNumber?: string;

	/** Employee name */
	@IsOptional()
	@MaxLength(100)
	name?: string;

	/** Department name */
	@IsOptional()
	@MaxLength(100)
	department?: string;

	/** Employee role for grouped drawing */
	@IsOptional()
	@IsEnum(EmployeeRole)
	role?: EmployeeRole;
}
