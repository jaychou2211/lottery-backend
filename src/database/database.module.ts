import { promises as fs } from 'node:fs';
import * as path from 'node:path';

import { Inject, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileMigrationProvider, Migrator } from 'kysely';
import { Logger } from 'nestjs-pino';

import { KYSELY_TOKEN, kyselyProvider, KyselyDatabase } from './database.provider';

@Module({
	providers: [kyselyProvider],
	exports: [KYSELY_TOKEN],
})
export class DatabaseModule implements OnModuleInit, OnModuleDestroy {
	private readonly migrator: Migrator;

	constructor(
		@Inject(KYSELY_TOKEN) private readonly db: KyselyDatabase,
		private readonly configService: ConfigService,
		private readonly logger: Logger,
	) {
		this.migrator = new Migrator({
			db: this.db,
			provider: new FileMigrationProvider({
				fs,
				path,
				migrationFolder: path.join(__dirname, 'migrations'),
			}),
		});
	}

	async onModuleInit(): Promise<void> {
		const runMigrations = this.configService.get<boolean>('database.runMigrationsOnStart', false);

		if (runMigrations) {
			this.logger.log('Running database migrations...', 'DatabaseModule');
			await this.runMigrations();
		}
	}

	async onModuleDestroy(): Promise<void> {
		await this.db.destroy();
		this.logger.log('Database connection closed', 'DatabaseModule');
	}

	private async runMigrations(): Promise<void> {
		const { error, results } = await this.migrator.migrateToLatest();

		results?.forEach((result) => {
			if (result.status === 'Success') {
				this.logger.log(`Migration "${result.migrationName}" executed successfully`, 'DatabaseModule');
			} else if (result.status === 'Error') {
				this.logger.error(`Migration "${result.migrationName}" failed`, 'DatabaseModule');
			}
		});

		if (error) {
			this.logger.error('Migration failed', error, 'DatabaseModule');
			throw error;
		}
	}
}

// Re-export for convenience
export { InjectKysely } from './kysely.decorator';
export type { KyselyDatabase } from './database.provider';
