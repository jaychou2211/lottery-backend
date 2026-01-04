import * as path from 'node:path';
import { PostgresDialect } from 'kysely';
import type { KyselyCTLConfig } from 'kysely-ctl';
import { Pool } from 'pg';

const config: KyselyCTLConfig = {
	dialect: new PostgresDialect({
		pool: new Pool({
			host: process.env.DATABASE_HOST || 'localhost',
			port: parseInt(process.env.DATABASE_PORT || '5432', 10),
			database: process.env.DATABASE_NAME || 'lottery',
			user: process.env.DATABASE_USER || 'postgres',
			password: process.env.DATABASE_PASSWORD || 'postgres',
		}),
	}),
	migrations: {
		migrationFolder: path.join(__dirname, 'src/database/migrations'),
	},
	seeds: {
		seedFolder: path.join(__dirname, 'src/database/seeds'),
	},
};

export default config;
