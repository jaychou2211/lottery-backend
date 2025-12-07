import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Employee table migration
 *
 * Stores employee reference data for raffle participation.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable('employee')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('staff_number', 'varchar(50)', (col) => col.notNull().unique())
		.addColumn('name', 'varchar(100)', (col) => col.notNull())
		.addColumn('department', 'varchar(100)', (col) => col.notNull())
		.addColumn('role', 'varchar(20)', (col) => col.notNull())
		.addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn('deleted_at', 'timestamptz')
		.execute();

	// Index on role for grouped queries
	await db.schema
		.createIndex('idx_employee_role')
		.on('employee')
		.column('role')
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable('employee').execute();
}
