import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';

import { InjectKysely, type KyselyDatabase, type EmployeeRow, type NewEmployee } from '../database';
import type { Employee } from '../domain/employee';
import { EmployeeRole } from '../domain/shared';
import type { EmployeeCsvRow } from './dto/sync-employee.dto';

export interface SyncResult {
	created: number;
	updated: number;
	deleted: number;
}

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

	/**
	 * Sync employees from CSV data.
	 * - Creates new employees (in CSV but not in DB)
	 * - Updates existing employees (in both CSV and DB)
	 * - Soft-deletes removed employees (in DB but not in CSV)
	 *
	 * All operations are performed in a single transaction.
	 */
	async sync(rows: EmployeeCsvRow[]): Promise<SyncResult> {
		return this.db.transaction().execute(async (trx) => {
			// Get current employees
			const currentRows = await trx
				.selectFrom('employee')
				.selectAll()
				.where('deleted_at', 'is', null)
				.execute();

			const currentByStaffNumber = new Map(currentRows.map((r) => [r.staff_number, r]));
			const csvStaffNumbers = new Set(rows.map((r) => r.staffNumber));

			// Categorize operations
			const toCreate: NewEmployee[] = [];
			const toUpdate: { id: number; row: EmployeeCsvRow }[] = [];
			const toDelete: number[] = [];

			// Find creates and updates
			for (const row of rows) {
				const existing = currentByStaffNumber.get(row.staffNumber);
				if (existing) {
					// Check if anything changed
					if (
						existing.name !== row.name ||
						existing.department !== row.department ||
						existing.role !== row.role
					) {
						toUpdate.push({ id: existing.id, row });
					}
				} else {
					toCreate.push({
						staff_number: row.staffNumber,
						name: row.name,
						department: row.department,
						role: row.role,
					});
				}
			}

			// Find deletes
			for (const current of currentRows) {
				if (!csvStaffNumbers.has(current.staff_number)) {
					toDelete.push(current.id);
				}
			}

			// Execute creates
			if (toCreate.length > 0) {
				await trx.insertInto('employee').values(toCreate).execute();
			}

			// Execute updates
			for (const { id, row } of toUpdate) {
				await trx
					.updateTable('employee')
					.set({
						name: row.name,
						department: row.department,
						role: row.role,
						updated_at: sql`CURRENT_TIMESTAMP`,
					})
					.where('id', '=', id)
					.execute();
			}

			// Execute deletes (soft delete)
			if (toDelete.length > 0) {
				await trx
					.updateTable('employee')
					.set({ deleted_at: sql`CURRENT_TIMESTAMP` })
					.where('id', 'in', toDelete)
					.execute();
			}

			return {
				created: toCreate.length,
				updated: toUpdate.length,
				deleted: toDelete.length,
			};
		});
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
