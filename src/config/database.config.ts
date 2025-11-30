import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
	filename: process.env.DATABASE_PATH || 'database/lottery.db',
	enableWAL: process.env.DATABASE_WAL !== 'false',
	enableForeignKeys: process.env.DATABASE_FOREIGN_KEYS !== 'false',
	runMigrationsOnStart: process.env.DATABASE_RUN_MIGRATIONS === 'true',
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
