import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.alterTable('raffle_participant')
		.addColumn('updated_at', 'datetime')
		.execute();

	await db.schema
		.alterTable('raffle_participant')
		.addColumn('deleted_at', 'datetime')
		.execute();

	await db.schema
		.alterTable('raffle_participant')
		.addColumn('tags', 'text')
		.execute();

	await sql`UPDATE raffle_participant SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`.execute(db);

	await db.schema
		.alterTable('raffle_participant')
		.dropColumn('attended')
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.alterTable('raffle_participant')
		.addColumn('attended', 'boolean', (col) => col.notNull().defaultTo(true))
		.execute();

	await db.schema
		.alterTable('raffle_participant')
		.dropColumn('tags')
		.execute();

	await db.schema
		.alterTable('raffle_participant')
		.dropColumn('deleted_at')
		.execute();

	await db.schema
		.alterTable('raffle_participant')
		.dropColumn('updated_at')
		.execute();
}
