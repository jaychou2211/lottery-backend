import type { Kysely } from 'kysely';

import { up as smokeTestUp } from './2024_001_smoke_test';
import { up as employeeUp } from './2024_002_employee';
import { up as prizeTemplateUp } from './2024_003_prize_template';
import { up as raffleUp } from './2024_004_raffle';
import { up as raffleVersionUp } from './2024_005_raffle_version';

/**
 * Ordered list of all migrations.
 * Add new migrations here in order.
 */
const migrations = [
	smokeTestUp,
	employeeUp,
	prizeTemplateUp,
	raffleUp,
	raffleVersionUp,
];

/**
 * Runs all migrations in order.
 * Used for in-memory test databases.
 */
export async function runAllMigrations(db: Kysely<unknown>): Promise<void> {
	for (const migration of migrations) {
		await migration(db);
	}
}
