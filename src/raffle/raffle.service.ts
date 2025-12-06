import { Injectable } from '@nestjs/common';

import { ConcurrencyError, NotFoundError } from './errors';
import { RaffleProjection, type RaffleListItemDto, type RaffleDetailDto, type DrawResultDto, type ParticipantStatusDto, type RaffleDetailOptions, type RaffleListFilters, type BonusPrizeDto } from './raffle.projection';
import { RaffleRepository } from './raffle.repository';
import { BonusEligibleCounts } from '../domain/shared';
import { DomainError } from '../domain/shared/domain-error';
import { DomainException, ResourceNotFoundException, OptimisticLockException } from '../shared/exception';

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
			this.handleCommandError(e);
		}
	}

	async delete(id: number): Promise<void> {
		const deleted = await this.repository.delete(id);
		if (!deleted) {
			throw new ResourceNotFoundException(new NotFoundError('Raffle', id));
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
	): Promise<BonusPrizeDto> {
		try {
			await this.repository.execute(id, (raffle) =>
				raffle.addBonusPrize({
					name: input.name,
					imageUrl: input.imageUrl,
					eligibleCounts: BonusEligibleCounts.create(input.total),
				}),
			);

			const prize = await this.projection.getLatestBonusPrize(id);
			if (!prize) {
				throw new Error('Bonus prize added but not found');
			}
			return prize;
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
			throw new ResourceNotFoundException(new NotFoundError('Raffle', id));
		}
		return result;
	}

	async getParticipantStatus(raffleId: number, staffNumber: string): Promise<ParticipantStatusDto> {
		const result = await this.projection.getParticipantStatus(raffleId, staffNumber);
		if (!result) {
			throw new ResourceNotFoundException(new NotFoundError('Participant', staffNumber));
		}
		return result;
	}

	private handleCommandError(e: unknown): never {
		if (e instanceof DomainError) {
			throw new DomainException(e);
		}
		if (e instanceof ConcurrencyError) {
			throw new OptimisticLockException(e);
		}
		if (e instanceof NotFoundError) {
			throw new ResourceNotFoundException(e);
		}
		throw e;
	}
}
