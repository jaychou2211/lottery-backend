import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Smoke test migration
 *
 * Verifies DB connection and migration mechanism work correctly.
 * Not a business table.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable('_smoke_test')
		.addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
		.addColumn('attr1', 'varchar(255)', (col) => col.notNull())
		.addColumn('attr2', 'varchar(255)')
		.addColumn('created_at', 'datetime', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable('_smoke_test').execute();
}
