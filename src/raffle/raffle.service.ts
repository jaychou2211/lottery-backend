import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { RaffleRepository } from './raffle.repository';
import { Raffle } from '../domain/raffle';
import { RafflePrize, type PersistedBonusPrize, type PersistedPrize } from '../domain/raffle/raffle-prize';
import { BonusEligibleCounts, RegularEligibleCounts } from '../domain/shared';
import { DomainError } from '../domain/shared/domain-error';
import { EmployeeService } from '../employee';
import { PrizeService } from '../prize';

@Injectable()
export class RaffleService {
	constructor(
		private readonly repository: RaffleRepository,
		private readonly employeeService: EmployeeService,
		private readonly prizeService: PrizeService,
	) {}

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

	/**
	 * Create a new raffle with all active employees and prize templates.
	 * Employees are added as participants, prize templates are converted to raffle prizes.
	 */
	async create(name: string): Promise<Raffle> {
		// 1. Create raffle in repository (gets ID)
		const raffle = await this.repository.create(name);

		// 2. Fetch all active employees and prize templates
		const [employees, prizeTemplates] = await Promise.all([
			this.employeeService.findAllActive(),
			this.prizeService.findAllActive(),
		]);

		// 3. Add participants (employees)
		let updated = raffle;
		if (employees.length > 0) {
			try {
				updated = updated.addParticipants(employees);
			} catch (e) {
				if (e instanceof DomainError) {
					throw new BadRequestException(e.message);
				}
				throw e;
			}
		}

		// 4. Convert prize templates to raffle prizes
		if (prizeTemplates.length > 0) {
			const rafflePrizes = prizeTemplates.map((template, index) =>
				RafflePrize.create({
					id: -1, // Temporary, will be replaced by DB
					rank: index + 1, // Rank by order
					name: template.name,
					prizeLevel: template.prizeLevel,
					imageUrl: template.imageUrl,
					eligibleCounts: RegularEligibleCounts.create(template.senior, template.junior),
					prizeTemplateId: template.id,
				}),
			);

			// Replace prizes in raffle
			updated = Raffle.create({
				id: updated.id,
				name: updated.name,
				status: updated.status,
				prizes: rafflePrizes as unknown as PersistedPrize[],
				participants: [...updated.participants],
				winners: [...updated.winners],
			});
		}

		// 5. Save and return
		return this.repository.save(updated);
	}

	async delete(id: number): Promise<void> {
		const deleted = await this.repository.delete(id);
		if (!deleted) {
			throw new NotFoundException(`Raffle with id ${id} not found`);
		}
	}

	async updateStatus(raffleId: number, status: 'READY' | 'COMPLETED'): Promise<Raffle> {
		const raffle = await this.findById(raffleId);
		try {
			const updated = status === 'READY' ? raffle.transitionToReady() : raffle.markAsCompleted();
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
			// Rank is set to 1 as placeholder; Raffle.addBonusPrize will reassign it
			const bonusPrize = RafflePrize.create({
				id: -1, // Temporary, will be replaced by DB
				rank: 1, // Placeholder, will be auto-assigned by Raffle.addBonusPrize
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

}
