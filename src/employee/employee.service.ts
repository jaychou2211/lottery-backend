import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { EmployeeRepository } from './employee.repository';
import type { Employee } from '../domain/employee';
import { EmployeeRole } from '../domain/shared';

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

	async create(data: {
		staffNumber: string;
		name: string;
		department: string;
		role: EmployeeRole;
	}): Promise<Employee> {
		const exists = await this.repository.existsByStaffNumber(data.staffNumber);
		if (exists) {
			throw new ConflictException(`Employee with staff number ${data.staffNumber} already exists`);
		}
		return this.repository.create(data);
	}

	async update(
		id: number,
		data: Partial<{
			staffNumber: string;
			name: string;
			department: string;
			role: EmployeeRole;
		}>,
	): Promise<Employee> {
		// Check if employee exists
		await this.findById(id);

		// Check for duplicate staff number if updating it
		if (data.staffNumber !== undefined) {
			const exists = await this.repository.existsByStaffNumber(data.staffNumber, id);
			if (exists) {
				throw new ConflictException(`Employee with staff number ${data.staffNumber} already exists`);
			}
		}

		const updated = await this.repository.update(id, data);
		if (!updated) {
			throw new NotFoundException(`Employee with id ${id} not found`);
		}
		return updated;
	}

	async delete(id: number): Promise<void> {
		const deleted = await this.repository.delete(id);
		if (!deleted) {
			throw new NotFoundException(`Employee with id ${id} not found`);
		}
	}
}
