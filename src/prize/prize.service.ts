import { Injectable, NotFoundException } from '@nestjs/common';

import { PrizeRepository } from './prize.repository';
import type { PrizeTemplate } from '../domain/prize-template';

@Injectable()
export class PrizeService {
	constructor(private readonly repository: PrizeRepository) {}

	async findAll(): Promise<PrizeTemplate[]> {
		return this.repository.findAll();
	}

	async findById(id: number): Promise<PrizeTemplate> {
		const prize = await this.repository.findById(id);
		if (!prize) {
			throw new NotFoundException(`Prize template with id ${id} not found`);
		}
		return prize;
	}

	async create(data: {
		name: string;
		prizeLevel: string;
		imageUrl: string;
	}): Promise<PrizeTemplate> {
		return this.repository.create(data);
	}

	async update(
		id: number,
		data: Partial<{
			name: string;
			prizeLevel: string;
			imageUrl: string;
		}>,
	): Promise<PrizeTemplate> {
		const updated = await this.repository.update(id, data);
		if (!updated) {
			throw new NotFoundException(`Prize template with id ${id} not found`);
		}
		return updated;
	}

	async delete(id: number): Promise<void> {
		const deleted = await this.repository.delete(id);
		if (!deleted) {
			throw new NotFoundException(`Prize template with id ${id} not found`);
		}
	}
}
