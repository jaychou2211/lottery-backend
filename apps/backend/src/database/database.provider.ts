import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import type { Database as DB } from './database.types';

export const KYSELY_TOKEN = Symbol('KYSELY');

export type KyselyDatabase = Kysely<DB>;

export const kyselyProvider: Provider = {
	provide: KYSELY_TOKEN,
	useFactory: (configService: ConfigService): KyselyDatabase => {
		const pool = new Pool({
			host: configService.get<string>('database.host'),
			port: configService.get<number>('database.port'),
			database: configService.get<string>('database.name'),
			user: configService.get<string>('database.user'),
			password: configService.get<string>('database.password'),
			max: configService.get<number>('database.maxConnections', 10),
		});

		return new Kysely<DB>({
			dialect: new PostgresDialect({ pool }),
		});
	},
	inject: [ConfigService],
};
