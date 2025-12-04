import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';

import { InjectKysely, type KyselyDatabase, type EmployeeRow, type NewEmployee, type EmployeeUpdate } from '../database';
import type { Employee } from '../domain/employee';
import { EmployeeRole } from '../domain/shared';

@Injectable()
export class EmployeeRepository {
	constructor(@InjectKysely() private readonly db: KyselyDatabase) {}

	async findAll(): Promise<Employee[]> {
		const rows = await this.db
			.selectFrom('employee')
			.selectAll()
			.where('deleted_at', 'is', null)
			.execute();
		return rows.map(this.toDomain);
	}

	async findById(id: number): Promise<Employee | null> {
		const row = await this.db
			.selectFrom('employee')
			.selectAll()
			.where('id', '=', id)
			.where('deleted_at', 'is', null)
			.executeTakeFirst();
		return row ? this.toDomain(row) : null;
	}

	async findByIds(ids: number[]): Promise<Employee[]> {
		if (ids.length === 0) return [];
		const rows = await this.db
			.selectFrom('employee')
			.selectAll()
			.where('id', 'in', ids)
			.where('deleted_at', 'is', null)
			.execute();
		return rows.map(this.toDomain);
	}

	/**
	 * Find all active (non-deleted) employees.
	 * Used when creating a new raffle.
	 */
	async findAllActive(): Promise<Employee[]> {
		return this.findAll();
	}

	async findByStaffNumber(staffNumber: string): Promise<Employee | null> {
		const row = await this.db
			.selectFrom('employee')
			.selectAll()
			.where('staff_number', '=', staffNumber)
			.where('deleted_at', 'is', null)
			.executeTakeFirst();
		return row ? this.toDomain(row) : null;
	}

	async create(data: {
		staffNumber: string;
		name: string;
		department: string;
		role: EmployeeRole;
	}): Promise<Employee> {
		const newEmployee: NewEmployee = {
			staff_number: data.staffNumber,
			name: data.name,
			department: data.department,
			role: data.role,
		};

		const result = await this.db
			.insertInto('employee')
			.values(newEmployee)
			.returning(['id'])
			.executeTakeFirstOrThrow();

		const created = await this.findById(result.id);
		if (!created) {
			throw new Error('Failed to create employee');
		}
		return created;
	}

	async update(
		id: number,
		data: Partial<{
			staffNumber: string;
			name: string;
			department: string;
			role: EmployeeRole;
		}>,
	): Promise<Employee | null> {
		const updateData: EmployeeUpdate = {};

		if (data.staffNumber !== undefined) updateData.staff_number = data.staffNumber;
		if (data.name !== undefined) updateData.name = data.name;
		if (data.department !== undefined) updateData.department = data.department;
		if (data.role !== undefined) updateData.role = data.role;

		if (Object.keys(updateData).length === 0) {
			return this.findById(id);
		}

		const result = await this.db
			.updateTable('employee')
			.set({
				...updateData,
				updated_at: sql`CURRENT_TIMESTAMP`,
			})
			.where('id', '=', id)
			.executeTakeFirst();

		if (result.numUpdatedRows === 0n) {
			return null;
		}

		return this.findById(id);
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.db
			.updateTable('employee')
			.set({ deleted_at: sql`CURRENT_TIMESTAMP` })
			.where('id', '=', id)
			.where('deleted_at', 'is', null)
			.executeTakeFirst();
		return result.numUpdatedRows > 0n;
	}

	async existsByStaffNumber(staffNumber: string, excludeId?: number): Promise<boolean> {
		let query = this.db
			.selectFrom('employee')
			.select('id')
			.where('staff_number', '=', staffNumber)
			.where('deleted_at', 'is', null);

		if (excludeId !== undefined) {
			query = query.where('id', '!=', excludeId);
		}

		const row = await query.executeTakeFirst();
		return row !== undefined;
	}

	private toDomain(row: EmployeeRow): Employee {
		return {
			id: row.id,
			staffNumber: row.staff_number,
			name: row.name,
			department: row.department,
			role: row.role as EmployeeRole,
		};
	}
}
