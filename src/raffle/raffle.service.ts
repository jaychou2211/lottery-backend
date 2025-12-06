import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { ConcurrencyError, NotFoundError } from './errors';
import { RaffleProjection, type RaffleListItemDto, type RaffleDetailDto, type DrawResultDto, type ParticipantStatusDto, type RaffleDetailOptions, type RaffleListFilters } from './raffle.projection';
import { RaffleRepository } from './raffle.repository';
import { BonusEligibleCounts } from '../domain/shared';
import { DomainError } from '../domain/shared/domain-error';

@Injectable()
export class RaffleService {
	constructor(
		private readonly repository: RaffleRepository,
		private readonly projection: RaffleProjection,
	) {}

	async create(name: string): Promise<number> {
		try {
			return await this.repository.create(name);
		} catch (e) {
			if (e instanceof DomainError) {
				throw new BadRequestException(e.message);
			}
			if (e instanceof NotFoundError) {
				throw new NotFoundException(e.message);
			}
			throw e;
		}
	}

	async delete(id: number): Promise<void> {
		const deleted = await this.repository.delete(id);
		if (!deleted) {
			throw new NotFoundException(`Raffle with id ${id} not found`);
		}
	}

	async transitionToReady(id: number): Promise<void> {
		try {
			await this.repository.execute(id, (raffle) => raffle.transitionToReady());
		} catch (e) {
			this.handleCommandError(e);
		}
	}

	async markAsCompleted(id: number): Promise<void> {
		try {
			await this.repository.execute(id, (raffle) => raffle.markAsCompleted());
		} catch (e) {
			this.handleCommandError(e);
		}
	}

	async draw(id: number): Promise<DrawResultDto> {
		try {
			await this.repository.execute(id, (raffle) => raffle.draw());

			const result = await this.projection.getLatestDrawResult(id);
			if (!result) {
				throw new Error('Draw succeeded but no result found');
			}
			return result;
		} catch (e) {
			this.handleCommandError(e);
		}
	}

	async addBonusPrize(
		id: number,
		input: {
			name: string;
			imageUrl: string;
			total: number;
		},
	): Promise<void> {
		try {
			await this.repository.execute(id, (raffle) =>
				raffle.addBonusPrize({
					name: input.name,
					imageUrl: input.imageUrl,
					eligibleCounts: BonusEligibleCounts.create(input.total),
				}),
			);
		} catch (e) {
			this.handleCommandError(e);
		}
	}

	async getList(filters?: RaffleListFilters): Promise<RaffleListItemDto[]> {
		return this.projection.getList(filters);
	}

	async getDetail(id: number, options?: RaffleDetailOptions): Promise<RaffleDetailDto> {
		const result = await this.projection.getDetail(id, options);
		if (!result) {
			throw new NotFoundException(`Raffle with id ${id} not found`);
		}
		return result;
	}

	async getParticipantStatus(raffleId: number, staffNumber: string): Promise<ParticipantStatusDto> {
		const result = await this.projection.getParticipantStatus(raffleId, staffNumber);
		if (!result) {
			throw new NotFoundException(`Participant with staffNumber ${staffNumber} not found in raffle ${raffleId}`);
		}
		return result;
	}

	private handleCommandError(e: unknown): never {
		if (e instanceof DomainError) {
			throw new BadRequestException(e.message);
		}
		if (e instanceof ConcurrencyError) {
			throw new ConflictException(e.message);
		}
		if (e instanceof NotFoundError) {
			throw new NotFoundException(e.message);
		}
		throw e;
	}
}
