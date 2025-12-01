import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Prize template table migration
 *
 * Stores prize templates for creating raffle prizes.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable('prize_template')
		.addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
		.addColumn('name', 'varchar(100)', (col) => col.notNull())
		.addColumn('prize_level', 'varchar(50)', (col) => col.notNull())
		.addColumn('image_url', 'varchar(500)', (col) => col.notNull())
		.addColumn('created_at', 'datetime', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.addColumn('updated_at', 'datetime', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable('prize_template').execute();
}
