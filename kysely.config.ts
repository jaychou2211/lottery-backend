import * as path from 'node:path';
import Database from 'better-sqlite3';
import { SqliteDialect } from 'kysely';
import type { KyselyCTLConfig } from 'kysely-ctl';

const databasePath = process.env.DATABASE_PATH || 'database/lottery.db';

const config: KyselyCTLConfig = {
	dialect: new SqliteDialect({
		database: new Database(databasePath),
	}),
	migrations: {
		migrationFolder: path.join(__dirname, 'src/database/migrations'),
	},
	seeds: {
		seedFolder: path.join(__dirname, 'src/database/seeds'),
	},
};

export default config;
