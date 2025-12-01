import { IsEnum, IsNotEmpty, MaxLength } from 'class-validator';

import { EmployeeRole } from '../../domain/shared';

export class CreateEmployeeDto {
	/** Employee staff number (unique identifier) */
	@IsNotEmpty()
	@MaxLength(50)
	staffNumber: string;

	/** Employee name */
	@IsNotEmpty()
	@MaxLength(100)
	name: string;

	/** Department name */
	@IsNotEmpty()
	@MaxLength(100)
	department: string;

	/** Employee role for grouped drawing */
	@IsEnum(EmployeeRole)
	role: EmployeeRole;
}
