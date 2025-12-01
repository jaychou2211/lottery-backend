import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { RaffleRepository } from './raffle.repository';
import type { Employee } from '../domain/employee';
import { Raffle } from '../domain/raffle';
import { RafflePrize, type PersistedBonusPrize, type PersistedPrize } from '../domain/raffle/raffle-prize';
import { BonusEligibleCounts, RegularEligibleCounts } from '../domain/shared';
import { DomainError } from '../domain/shared/domain-error';

@Injectable()
export class RaffleService {
	constructor(private readonly repository: RaffleRepository) {}

	async findAll(): Promise<Raffle[]> {
		return this.repository.findAll();
	}

	async findById(id: number): Promise<Raffle> {
		const raffle = await this.repository.findById(id);
		if (!raffle) {
			throw new NotFoundException(`Raffle with id ${id} not found`);
		}
		return raffle;
	}

	async create(name: string): Promise<Raffle> {
		return this.repository.create(name);
	}

	async delete(id: number): Promise<void> {
		const deleted = await this.repository.delete(id);
		if (!deleted) {
			throw new NotFoundException(`Raffle with id ${id} not found`);
		}
	}

	async addParticipants(raffleId: number, employees: readonly Employee[]): Promise<Raffle> {
		const raffle = await this.findById(raffleId);
		try {
			const updated = raffle.addParticipants(employees);
			return this.repository.save(updated);
		} catch (e) {
			if (e instanceof DomainError) {
				throw new BadRequestException(e.message);
			}
			throw e;
		}
	}

	async markAttendance(
		raffleId: number,
		records: readonly { employeeId: number; attended: boolean }[],
	): Promise<Raffle> {
		const raffle = await this.findById(raffleId);
		try {
			const updated = raffle.markAttendance(records);
			return this.repository.save(updated);
		} catch (e) {
			if (e instanceof DomainError) {
				throw new BadRequestException(e.message);
			}
			throw e;
		}
	}

	async transitionToReady(raffleId: number): Promise<Raffle> {
		const raffle = await this.findById(raffleId);
		try {
			const updated = raffle.transitionToReady();
			return this.repository.save(updated);
		} catch (e) {
			if (e instanceof DomainError) {
				throw new BadRequestException(e.message);
			}
			throw e;
		}
	}

	async draw(raffleId: number, rank: number): Promise<Raffle> {
		const raffle = await this.findById(raffleId);
		try {
			const updated = raffle.draw(rank);
			return this.repository.save(updated);
		} catch (e) {
			if (e instanceof DomainError) {
				throw new BadRequestException(e.message);
			}
			throw e;
		}
	}

	async addBonusPrize(
		raffleId: number,
		prize: {
			name: string;
			prizeLevel: string;
			imageUrl: string;
			total: number;
			prizeTemplateId?: number;
		},
	): Promise<Raffle> {
		const raffle = await this.findById(raffleId);
		try {
			// Create bonus prize (id will be assigned by DB, use temp id for type safety)
			const bonusPrize = RafflePrize.create({
				id: -1, // Temporary, will be replaced by DB
				rank: 0, // Will be auto-assigned by Raffle.addBonusPrize
				name: prize.name,
				prizeLevel: prize.prizeLevel,
				imageUrl: prize.imageUrl,
				eligibleCounts: BonusEligibleCounts.create(prize.total),
				prizeTemplateId: prize.prizeTemplateId,
			}) as PersistedBonusPrize;

			const updated = raffle.addBonusPrize(bonusPrize);
			return this.repository.save(updated);
		} catch (e) {
			if (e instanceof DomainError) {
				throw new BadRequestException(e.message);
			}
			throw e;
		}
	}

	async markAsCompleted(raffleId: number): Promise<Raffle> {
		const raffle = await this.findById(raffleId);
		try {
			const updated = raffle.markAsCompleted();
			return this.repository.save(updated);
		} catch (e) {
			if (e instanceof DomainError) {
				throw new BadRequestException(e.message);
			}
			throw e;
		}
	}

	async addPrizes(
		raffleId: number,
		prizes: readonly {
			rank: number;
			name: string;
			prizeLevel: string;
			imageUrl: string;
			senior: number;
			junior: number;
			prizeTemplateId?: number;
		}[],
	): Promise<Raffle> {
		const raffle = await this.findById(raffleId);

		// Create prizes with proper eligible counts
		const rafflePrizes = prizes.map((p) =>
			RafflePrize.create({
				id: -1, // Temporary, will be replaced by DB
				rank: p.rank,
				name: p.name,
				prizeLevel: p.prizeLevel,
				imageUrl: p.imageUrl,
				eligibleCounts: RegularEligibleCounts.create(p.senior, p.junior),
				prizeTemplateId: p.prizeTemplateId,
			}),
		);

		// Create new raffle with prizes
		// Note: prizes don't have real IDs yet, they'll be assigned by the DB
		const updated = Raffle.create({
			id: raffle.id,
			name: raffle.name,
			status: raffle.status,
			prizes: rafflePrizes as unknown as PersistedPrize[],
			participants: [...raffle.participants],
			winners: [...raffle.winners],
		});

		return this.repository.save(updated);
	}
}
