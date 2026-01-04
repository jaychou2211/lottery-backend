import type { Kysely } from 'kysely';

/**
 * Add version column to raffle table for optimistic locking.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.alterTable('raffle')
		.addColumn('version', 'integer', (col) => col.notNull().defaultTo(1))
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.alterTable('raffle').dropColumn('version').execute();
}
