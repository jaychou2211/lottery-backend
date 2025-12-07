import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
	host: process.env.DATABASE_HOST || 'localhost',
	port: parseInt(process.env.DATABASE_PORT || '5432', 10),
	name: process.env.DATABASE_NAME || 'lottery',
	user: process.env.DATABASE_USER || 'postgres',
	password: process.env.DATABASE_PASSWORD || 'postgres',
	maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
	runMigrationsOnStart: process.env.DATABASE_RUN_MIGRATIONS === 'true',
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
