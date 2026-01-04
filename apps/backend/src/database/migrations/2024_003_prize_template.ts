import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Prize template table migration
 *
 * Stores prize templates for creating raffle prizes.
 * rank format: "{level}-{sequence}" (e.g., "1-1", "2-3", "5-1")
 */
export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable('prize_template')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('name', 'varchar(100)', (col) => col.notNull())
		.addColumn('rank', 'varchar(10)', (col) => col.notNull())
		.addColumn('image_url', 'varchar(500)', (col) => col.notNull())
		.addColumn('senior', 'integer', (col) => col.notNull())
		.addColumn('junior', 'integer', (col) => col.notNull())
		.addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn('deleted_at', 'timestamptz')
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable('prize_template').execute();
}
