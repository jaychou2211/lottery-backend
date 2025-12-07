import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { Kysely } from 'kysely';
import { Kysely as KyselyClass, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { LoggerModule } from '../src/common/logger';
import { loggerConfig } from '../src/config/logger.config';
import { KYSELY_TOKEN, type KyselyDatabase } from '../src/database/database.provider';
import type { Database as DB } from '../src/database/database.types';
import { runAllMigrations } from '../src/database/migrations';
import { DemoModule } from '../src/demo';
import { EmployeeModule } from '../src/employee';
import { PrizeModule } from '../src/prize';
import { RaffleModule } from '../src/raffle';

let container: StartedPostgreSqlContainer | null = null;

/**
 * Starts a PostgreSQL container for testing using Testcontainers.
 * Container is reused across tests in the same test suite.
 */
async function startTestContainer(): Promise<StartedPostgreSqlContainer> {
	if (!container) {
		container = await new PostgreSqlContainer('postgres:17-alpine').start();
	}
	return container;
}

/**
 * Creates a Kysely database instance connected to the test container.
 */
function createTestDatabase(connectionUri: string): KyselyDatabase {
	const pool = new Pool({ connectionString: connectionUri });
	return new KyselyClass<DB>({
		dialect: new PostgresDialect({ pool }),
	});
}

/**
 * Runs all migrations on the given database.
 * Uses the actual migration files to ensure consistency.
 */
async function runMigrations(db: KyselyDatabase): Promise<void> {
	await runAllMigrations(db as Kysely<unknown>);
}

/**
 * Seeds the test database with minimal data for e2e tests.
 */
async function seedTestData(db: KyselyDatabase): Promise<void> {
	// Insert employees (mix of SENIOR and JUNIOR)
	await db
		.insertInto('employee')
		.values([
			{ staff_number: 'S001', name: 'Senior 1', department: 'Engineering', role: 'SENIOR' },
			{ staff_number: 'S002', name: 'Senior 2', department: 'Engineering', role: 'SENIOR' },
			{ staff_number: 'S003', name: 'Senior 3', department: 'Engineering', role: 'SENIOR' },
			{ staff_number: 'S004', name: 'Senior 4', department: 'Sales', role: 'SENIOR' },
			{ staff_number: 'S005', name: 'Senior 5', department: 'Sales', role: 'SENIOR' },
			{ staff_number: 'J001', name: 'Junior 1', department: 'Engineering', role: 'JUNIOR' },
			{ staff_number: 'J002', name: 'Junior 2', department: 'Engineering', role: 'JUNIOR' },
			{ staff_number: 'J003', name: 'Junior 3', department: 'Sales', role: 'JUNIOR' },
			{ staff_number: 'J004', name: 'Junior 4', department: 'Sales', role: 'JUNIOR' },
			{ staff_number: 'J005', name: 'Junior 5', department: 'HR', role: 'JUNIOR' },
		])
		.execute();

	// Insert prize templates
	await db
		.insertInto('prize_template')
		.values([
			{ name: '小獎 A', rank: '1-1', image_url: '/images/prize-1-1.png', senior: 1, junior: 1 },
			{ name: '小獎 B', rank: '1-2', image_url: '/images/prize-1-2.png', senior: 1, junior: 1 },
			{ name: '中獎', rank: '2-1', image_url: '/images/prize-2-1.png', senior: 1, junior: 1 },
			{ name: '大獎', rank: '3-1', image_url: '/images/prize-3-1.png', senior: 1, junior: 1 },
			{ name: '頭獎', rank: '5-1', image_url: '/images/prize-5-1.png', senior: 1, junior: 1 },
		])
		.execute();
}

export interface TestApp {
	app: INestApplication;
	db: KyselyDatabase;
}

/**
 * Creates a test application with an isolated PostgreSQL container.
 * Use this for e2e tests to avoid conflicts with development database.
 */
export async function createTestApp(): Promise<TestApp> {
	const pgContainer = await startTestContainer();
	const db = createTestDatabase(pgContainer.getConnectionUri());

	await runMigrations(db);
	await seedTestData(db);

	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [
			ConfigModule.forRoot({
				isGlobal: true,
				load: [loggerConfig],
			}),
			LoggerModule,
			DemoModule,
			EmployeeModule,
			PrizeModule,
			RaffleModule,
		],
		controllers: [AppController],
		providers: [AppService],
	})
		.overrideProvider(KYSELY_TOKEN)
		.useValue(db)
		.compile();

	const app = moduleFixture.createNestApplication();
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
		}),
	);
	await app.init();

	return { app, db };
}

/**
 * Closes the test application and database connection.
 */
export async function closeTestApp(testApp: TestApp): Promise<void> {
	await testApp.app.close();
	await testApp.db.destroy();
}

/**
 * Stops the PostgreSQL container.
 * Call this in afterAll() of your test suite.
 */
export async function stopTestContainer(): Promise<void> {
	if (container) {
		await container.stop();
		container = null;
	}
}
