import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';

import { InjectKysely, type KyselyDatabase, type PrizeTemplateRow, type NewPrizeTemplate, type PrizeTemplateUpdate } from '../database';
import type { PrizeTemplate } from '../domain/prize-template';

@Injectable()
export class PrizeRepository {
	constructor(@InjectKysely() private readonly db: KyselyDatabase) {}

	async findAll(): Promise<PrizeTemplate[]> {
		const rows = await this.db.selectFrom('prize_template').selectAll().execute();
		return rows.map(this.toDomain);
	}

	async findById(id: number): Promise<PrizeTemplate | null> {
		const row = await this.db
			.selectFrom('prize_template')
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst();
		return row ? this.toDomain(row) : null;
	}

	async create(data: {
		name: string;
		prizeLevel: string;
		imageUrl: string;
	}): Promise<PrizeTemplate> {
		const newPrize: NewPrizeTemplate = {
			name: data.name,
			prize_level: data.prizeLevel,
			image_url: data.imageUrl,
		};

		const result = await this.db
			.insertInto('prize_template')
			.values(newPrize)
			.returning(['id'])
			.executeTakeFirstOrThrow();

		const created = await this.findById(result.id);
		if (!created) {
			throw new Error('Failed to create prize template');
		}
		return created;
	}

	async update(
		id: number,
		data: Partial<{
			name: string;
			prizeLevel: string;
			imageUrl: string;
		}>,
	): Promise<PrizeTemplate | null> {
		const updateData: PrizeTemplateUpdate = {};

		if (data.name !== undefined) updateData.name = data.name;
		if (data.prizeLevel !== undefined) updateData.prize_level = data.prizeLevel;
		if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;

		if (Object.keys(updateData).length === 0) {
			return this.findById(id);
		}

		const result = await this.db
			.updateTable('prize_template')
			.set({
				...updateData,
				updated_at: sql`CURRENT_TIMESTAMP`,
			})
			.where('id', '=', id)
			.executeTakeFirst();

		if (result.numUpdatedRows === 0n) {
			return null;
		}

		return this.findById(id);
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.db
			.deleteFrom('prize_template')
			.where('id', '=', id)
			.executeTakeFirst();
		return result.numDeletedRows > 0n;
	}

	private toDomain(row: PrizeTemplateRow): PrizeTemplate {
		return {
			id: row.id,
			name: row.name,
			prizeLevel: row.prize_level,
			imageUrl: row.image_url,
		};
	}
}
