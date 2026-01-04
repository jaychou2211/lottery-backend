import { Injectable, NotFoundException } from '@nestjs/common';

import type { PrizeCsvRow, PrizeSyncResultDto } from './dto';
import { PrizeRepository } from './prize.repository';
import type { PrizeTemplate } from '../domain/prize-template';

@Injectable()
export class PrizeService {
	constructor(private readonly repository: PrizeRepository) {}

	async findAll(): Promise<PrizeTemplate[]> {
		return this.repository.findAll();
	}

	/**
	 * Find all active (non-deleted) prize templates.
	 * Used when creating a new raffle.
	 */
	async findAllActive(): Promise<PrizeTemplate[]> {
		return this.repository.findAllActive();
	}

	async findById(id: number): Promise<PrizeTemplate> {
		const prize = await this.repository.findById(id);
		if (!prize) {
			throw new NotFoundException(`Prize template with id ${id} not found`);
		}
		return prize;
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
