import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Raffle aggregate tables migration
 *
 * Creates tables for:
 * - raffle: The aggregate root
 * - raffle_participant: Employee snapshots within a raffle
 * - raffle_prize: Prizes configured for a raffle
 * - winner_record: Records of who won which prize
 */
export async function up(db: Kysely<unknown>): Promise<void> {
	// Raffle (Aggregate Root)
	await db.schema
		.createTable('raffle')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('name', 'varchar(100)', (col) => col.notNull())
		.addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('DRAFT'))
		.addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
		.execute();

	// Raffle Participant (Employee snapshot within raffle)
	await db.schema
		.createTable('raffle_participant')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('raffle_id', 'integer', (col) => col.notNull().references('raffle.id').onDelete('cascade'))
		.addColumn('employee_id', 'integer', (col) => col.notNull())
		.addColumn('staff_number', 'varchar(50)', (col) => col.notNull())
		.addColumn('name', 'varchar(100)', (col) => col.notNull())
		.addColumn('department', 'varchar(100)', (col) => col.notNull())
		.addColumn('role', 'varchar(20)', (col) => col.notNull())
		.addColumn('tags', 'text')
		.addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn('deleted_at', 'timestamptz')
		.execute();

	// Unique constraint: one employee per raffle
	await db.schema
		.createIndex('idx_raffle_participant_unique')
		.on('raffle_participant')
		.columns(['raffle_id', 'employee_id'])
		.unique()
		.execute();

	// Raffle Prize
	// rank format: "{level}-{sequence}" (e.g., "1-1", "2-3", "5-1")
	await db.schema
		.createTable('raffle_prize')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('raffle_id', 'integer', (col) => col.notNull().references('raffle.id').onDelete('cascade'))
		.addColumn('rank', 'varchar(10)', (col) => col.notNull())
		.addColumn('name', 'varchar(100)', (col) => col.notNull())
		.addColumn('image_url', 'varchar(500)', (col) => col.notNull())
		.addColumn('prize_template_id', 'integer')
		.addColumn('eligible_kind', 'varchar(10)', (col) => col.notNull())
		.addColumn('eligible_total', 'integer', (col) => col.notNull())
		.addColumn('eligible_senior', 'integer')
		.addColumn('eligible_junior', 'integer')
		.addColumn('is_drawn', 'boolean', (col) => col.notNull().defaultTo(false))
		.addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
		.execute();

	// Unique constraint: one rank per raffle
	await db.schema
		.createIndex('idx_raffle_prize_unique_rank')
		.on('raffle_prize')
		.columns(['raffle_id', 'rank'])
		.unique()
		.execute();

	// Winner Record
	await db.schema
		.createTable('winner_record')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('raffle_id', 'integer', (col) => col.notNull().references('raffle.id').onDelete('cascade'))
		.addColumn('raffle_prize_id', 'integer', (col) => col.notNull().references('raffle_prize.id').onDelete('cascade'))
		.addColumn('participant_id', 'integer', (col) => col.notNull().references('raffle_participant.id').onDelete('cascade'))
		.addColumn('drawn_group', 'varchar(10)', (col) => col.notNull())
		.addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
		.execute();

	// Index for querying winners by raffle
	await db.schema
		.createIndex('idx_winner_record_raffle')
		.on('winner_record')
		.column('raffle_id')
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable('winner_record').execute();
	await db.schema.dropTable('raffle_prize').execute();
	await db.schema.dropTable('raffle_participant').execute();
	await db.schema.dropTable('raffle').execute();
}
