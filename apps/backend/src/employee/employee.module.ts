import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database';
import { EmployeeController } from './employee.controller';
import { EmployeeRepository } from './employee.repository';

@Module({
	imports: [DatabaseModule],
	controllers: [EmployeeController],
	providers: [EmployeeRepository],
})
export class EmployeeModule {}
