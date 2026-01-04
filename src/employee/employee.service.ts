import { Injectable, NotFoundException } from '@nestjs/common';

import type { EmployeeCsvRow, SyncResultDto } from './dto/sync-employee.dto';
import { EmployeeRepository } from './employee.repository';
import type { Employee } from '../domain/employee';

@Injectable()
export class EmployeeService {
	constructor(private readonly repository: EmployeeRepository) {}

	async findAll(): Promise<Employee[]> {
		return this.repository.findAll();
	}

	/**
	 * Find all active (non-deleted) employees.
	 * Used when creating a new raffle.
	 */
	async findAllActive(): Promise<Employee[]> {
		return this.repository.findAllActive();
	}

	async findById(id: number): Promise<Employee> {
		const employee = await this.repository.findById(id);
		if (!employee) {
			throw new NotFoundException(`Employee with id ${id} not found`);
		}
		return employee;
	}

	async findByIds(ids: number[]): Promise<Employee[]> {
		return this.repository.findByIds(ids);
	}

	/**
	 * Sync employees from CSV data.
	 * Replaces the entire employee list with the provided data.
	 */
	async sync(rows: EmployeeCsvRow[]): Promise<SyncResultDto> {
		const result = await this.repository.sync(rows);
		const currentEmployees = await this.repository.findAll();

		return {
			created: result.created,
			updated: result.updated,
			deleted: result.deleted,
			total: currentEmployees.length,
		};
	}
}
