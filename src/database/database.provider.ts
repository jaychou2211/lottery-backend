/* eslint-disable @typescript-eslint/no-require-imports */
import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type BetterSqlite3 from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';

import type { Database as DB } from './database.types';

// better-sqlite3 needs require for CommonJS compatibility
const Database = require('better-sqlite3') as typeof BetterSqlite3;

export const KYSELY_TOKEN = Symbol('KYSELY');

export type KyselyDatabase = Kysely<DB>;

export const kyselyProvider: Provider = {
	provide: KYSELY_TOKEN,
	useFactory: (configService: ConfigService): KyselyDatabase => {
		const filename = configService.get<string>('database.filename', 'database/lottery.db');
		const enableWAL = configService.get<boolean>('database.enableWAL', true);
		const enableForeignKeys = configService.get<boolean>('database.enableForeignKeys', true);

		const sqliteDb = new Database(filename);

		// SQLite pragmas for performance and integrity
		if (enableWAL) {
			sqliteDb.pragma('journal_mode = WAL');
		}
		if (enableForeignKeys) {
			sqliteDb.pragma('foreign_keys = ON');
		}

		return new Kysely<DB>({
			dialect: new SqliteDialect({
				database: sqliteDb,
			}),
		});
	},
	inject: [ConfigService],
};
