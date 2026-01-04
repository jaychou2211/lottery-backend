import { registerAs } from '@nestjs/config';

const requireEnv = (key: string): string => {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
};

export const databaseConfig = registerAs('database', () => ({
	host: requireEnv('DATABASE_HOST'),
	port: parseInt(requireEnv('DATABASE_PORT'), 10),
	name: requireEnv('DATABASE_NAME'),
	user: requireEnv('DATABASE_USER'),
	password: requireEnv('DATABASE_PASSWORD'),
	maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
	runMigrationsOnStart: process.env.DATABASE_RUN_MIGRATIONS === 'true',
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
