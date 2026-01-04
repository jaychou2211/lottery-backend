import { Injectable } from '@nestjs/common';

import type { PrizeCsvRow, PrizeSyncResultDto } from './dto';
import { PrizeRepository } from './prize.repository';
import type { PrizeTemplateRow } from '../database';

@Injectable()
export class PrizeService {
	constructor(private readonly repository: PrizeRepository) {}

	async findAll(): Promise<PrizeTemplateRow[]> {
		return this.repository.findAll();
	}

	/**
	 * Sync prize templates from CSV data.
	 * Returns the sync result including the total count of active prizes.
	 */
	async sync(rows: PrizeCsvRow[]): Promise<PrizeSyncResultDto> {
		const result = await this.repository.sync(rows);
		const currentPrizes = await this.repository.findAll();
		return {
			...result,
			total: currentPrizes.length,
		};
	}
}
