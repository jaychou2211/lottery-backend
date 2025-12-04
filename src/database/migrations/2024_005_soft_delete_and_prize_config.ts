import type { Kysely } from 'kysely';

/**
 * Migration: Add soft delete and prize configuration
 *
 * - Add deleted_at to employee table
 * - Add deleted_at, senior, junior to prize_template table
 */
export async function up(db: Kysely<unknown>): Promise<void> {
	// Add deleted_at to employee
	await db.schema
		.alterTable('employee')
		.addColumn('deleted_at', 'datetime')
		.execute();

	// Add deleted_at, senior, junior to prize_template
	await db.schema
		.alterTable('prize_template')
		.addColumn('deleted_at', 'datetime')
		.execute();

	await db.schema
		.alterTable('prize_template')
		.addColumn('senior', 'integer', (col) => col.notNull().defaultTo(0))
		.execute();

	await db.schema
		.alterTable('prize_template')
		.addColumn('junior', 'integer', (col) => col.notNull().defaultTo(0))
		.execute();
}

export async function down(_db: Kysely<unknown>): Promise<void> {
	// SQLite doesn't support DROP COLUMN directly, need to recreate tables
	// For development, we'll just leave this as a no-op
	// In production, you'd need to recreate the tables without these columns
}
