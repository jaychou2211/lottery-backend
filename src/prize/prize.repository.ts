import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';

import { InjectKysely, type KyselyDatabase, type NewPrizeTemplate, type PrizeTemplateRow } from '../database';
import type { PrizeTemplate } from '../domain/prize-template';
import type { PrizeCsvRow } from './dto/sync-prize.dto';

export interface SyncResult {
	created: number;
	updated: number;
	deleted: number;
}

@Injectable()
export class PrizeRepository {
	constructor(@InjectKysely() private readonly db: KyselyDatabase) {}

	async findAll(): Promise<PrizeTemplate[]> {
		const rows = await this.db
			.selectFrom('prize_template')
			.selectAll()
			.where('deleted_at', 'is', null)
			.execute();
		return rows.map(this.toDomain);
	}

	async findById(id: number): Promise<PrizeTemplate | null> {
		const row = await this.db
			.selectFrom('prize_template')
			.selectAll()
			.where('id', '=', id)
			.where('deleted_at', 'is', null)
			.executeTakeFirst();
		return row ? this.toDomain(row) : null;
	}

	/**
	 * Find all active (non-deleted) prize templates.
	 * Used when creating a new raffle.
	 */
	async findAllActive(): Promise<PrizeTemplate[]> {
		return this.findAll();
	}

	/**
	 * Sync prize templates from CSV data.
	 * - Creates new prizes (in CSV but not in DB)
	 * - Updates existing prizes (in both CSV and DB)
	 * - Soft-deletes removed prizes (in DB but not in CSV)
	 *
	 * Uses `rank` as the unique key for matching.
	 * All operations are performed in a single transaction.
	 */
	async sync(rows: PrizeCsvRow[]): Promise<SyncResult> {
		return this.db.transaction().execute(async (trx) => {
			// Get current prize templates
			const currentRows = await trx
				.selectFrom('prize_template')
				.selectAll()
				.where('deleted_at', 'is', null)
				.execute();

			const currentByRank = new Map(currentRows.map((r) => [r.rank, r]));
			const csvRanks = new Set(rows.map((r) => r.rank));

			// Categorize operations
			const toCreate: NewPrizeTemplate[] = [];
			const toUpdate: { id: number; row: PrizeCsvRow }[] = [];
			const toDelete: number[] = [];

			// Find creates and updates
			for (const row of rows) {
				const existing = currentByRank.get(row.rank);
				if (existing) {
					// Check if anything changed
					if (
						existing.name !== row.name ||
						existing.image_url !== row.imageUrl ||
						existing.senior !== row.senior ||
						existing.junior !== row.junior
					) {
						toUpdate.push({ id: existing.id, row });
					}
				} else {
					toCreate.push({
						name: row.name,
						rank: row.rank,
						image_url: row.imageUrl,
						senior: row.senior,
						junior: row.junior,
					});
				}
			}

			// Find deletes
			for (const current of currentRows) {
				if (!csvRanks.has(current.rank)) {
					toDelete.push(current.id);
				}
			}

			// Execute creates
			if (toCreate.length > 0) {
				await trx.insertInto('prize_template').values(toCreate).execute();
			}

			// Execute updates
			for (const { id, row } of toUpdate) {
				await trx
					.updateTable('prize_template')
					.set({
						name: row.name,
						image_url: row.imageUrl,
						senior: row.senior,
						junior: row.junior,
						updated_at: sql`CURRENT_TIMESTAMP`,
					})
					.where('id', '=', id)
					.execute();
			}

			// Execute deletes (soft delete)
			if (toDelete.length > 0) {
				await trx
					.updateTable('prize_template')
					.set({ deleted_at: sql`CURRENT_TIMESTAMP` })
					.where('id', 'in', toDelete)
					.execute();
			}

			return {
				created: toCreate.length,
				updated: toUpdate.length,
				deleted: toDelete.length,
			};
		});
	}

	private toDomain(row: PrizeTemplateRow): PrizeTemplate {
		return {
			id: row.id,
			name: row.name,
			rank: row.rank,
			imageUrl: row.image_url,
			senior: row.senior,
			junior: row.junior,
		};
	}
}
