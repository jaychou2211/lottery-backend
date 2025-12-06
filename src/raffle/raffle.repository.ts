import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';

import {
	InjectKysely,
	type KyselyDatabase,
	type RaffleRow,
	type RaffleParticipantRow,
	type RafflePrizeRow,
	type WinnerRecordRow,
	type NewRaffle,
	type NewRaffleParticipant,
	type NewRafflePrize,
	type NewWinnerRecord,
} from '../database';
import { Raffle } from '../domain/raffle';
import { RaffleParticipant } from '../domain/raffle/raffle-participant';
import { RafflePrize, type PersistedPrize } from '../domain/raffle/raffle-prize';
import { WinnerRecord } from '../domain/raffle/winner-record';
import {
	RaffleStatus,
	EmployeeRole,
	DrawnGroup,
	RegularEligibleCounts,
	BonusEligibleCounts,
	PrizeRank,
} from '../domain/shared';

@Injectable()
export class RaffleRepository {
	constructor(@InjectKysely() private readonly db: KyselyDatabase) {}

	async findAll(): Promise<Raffle[]> {
		const rows = await this.db.selectFrom('raffle').selectAll().execute();
		const raffles: Raffle[] = [];
		for (const row of rows) {
			const raffle = await this.loadAggregate(row);
			raffles.push(raffle);
		}
		return raffles;
	}

	async findById(id: number): Promise<Raffle | null> {
		const row = await this.db
			.selectFrom('raffle')
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst();
		if (!row) return null;
		return this.loadAggregate(row);
	}

	async create(name: string): Promise<Raffle> {
		const newRaffle: NewRaffle = { name, status: RaffleStatus.DRAFT };
		const result = await this.db
			.insertInto('raffle')
			.values(newRaffle)
			.returning(['id'])
			.executeTakeFirstOrThrow();

		const raffle = await this.findById(result.id);
		if (!raffle) throw new Error('Failed to create raffle');
		return raffle;
	}

	async save(raffle: Raffle): Promise<Raffle> {
		await this.db.transaction().execute(async (trx) => {
			// Update raffle status
			await trx
				.updateTable('raffle')
				.set({ status: raffle.status, updated_at: sql`CURRENT_TIMESTAMP` })
				.where('id', '=', raffle.id)
				.execute();

			// Sync participants
			await this.syncParticipants(trx, raffle);

			// Sync prizes
			await this.syncPrizes(trx, raffle);

			// Sync winners
			await this.syncWinners(trx, raffle);
		});

		const saved = await this.findById(raffle.id);
		if (!saved) throw new Error('Failed to save raffle');
		return saved;
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.db
			.deleteFrom('raffle')
			.where('id', '=', id)
			.executeTakeFirst();
		return result.numDeletedRows > 0n;
	}

	private async loadAggregate(row: RaffleRow): Promise<Raffle> {
		const [participantRows, prizeRows, winnerRows] = await Promise.all([
			this.db.selectFrom('raffle_participant').selectAll().where('raffle_id', '=', row.id).where('deleted_at', 'is', null).execute(),
			this.db.selectFrom('raffle_prize').selectAll().where('raffle_id', '=', row.id).orderBy('rank').execute(),
			this.db.selectFrom('winner_record').selectAll().where('raffle_id', '=', row.id).execute(),
		]);

		const participants = participantRows.map((p) => this.toParticipant(p));
		const prizes = prizeRows.map((p) => this.toPrize(p)) as PersistedPrize[];
		const winners = winnerRows.map((w) => this.toWinner(w));

		return Raffle.create({
			id: row.id,
			name: row.name,
			status: row.status as RaffleStatus,
			prizes,
			participants,
			winners,
		});
	}

	private async syncParticipants(trx: KyselyDatabase, raffle: Raffle): Promise<void> {
		const existingRows = await trx
			.selectFrom('raffle_participant')
			.select(['id', 'employee_id'])
			.where('raffle_id', '=', raffle.id)
			.where('deleted_at', 'is', null)
			.execute();

		const existingMap = new Map(existingRows.map((r) => [r.employee_id, r]));

		for (const p of raffle.participants) {
			const existing = existingMap.get(p.employeeId);
			if (existing) {
				existingMap.delete(p.employeeId);
			} else {
				const newParticipant: NewRaffleParticipant = {
					raffle_id: raffle.id,
					employee_id: p.employeeId,
					staff_number: p.staffNumber,
					name: p.name,
					department: p.department,
					role: p.role,
					tags: p.tags.length > 0 ? JSON.stringify(p.tags) : null,
				};
				await trx.insertInto('raffle_participant').values(newParticipant).execute();
			}
		}

		// Soft delete removed participants
		const removedIds = Array.from(existingMap.values()).map((r) => r.id);
		if (removedIds.length > 0) {
			await trx
				.updateTable('raffle_participant')
				.set({ deleted_at: new Date().toISOString() })
				.where('id', 'in', removedIds)
				.execute();
		}
	}

	private async syncPrizes(trx: KyselyDatabase, raffle: Raffle): Promise<void> {
		const existingRows = await trx
			.selectFrom('raffle_prize')
			.select(['id', 'rank', 'is_drawn'])
			.where('raffle_id', '=', raffle.id)
			.execute();

		const existingMap = new Map(existingRows.map((r) => [r.rank, r]));

		for (const prize of raffle.prizes) {
			const rankStr = prize.rank.toString();
			const existing = existingMap.get(rankStr);
			if (existing) {
				// Update is_drawn if changed
				if ((existing.is_drawn === 1) !== prize.isDrawn) {
					await trx
						.updateTable('raffle_prize')
						.set({ is_drawn: prize.isDrawn ? 1 : 0 })
						.where('id', '=', existing.id)
						.execute();
				}
				existingMap.delete(rankStr);
			} else {
				// Insert new prize
				const newPrize: NewRafflePrize = {
					raffle_id: raffle.id,
					rank: rankStr,
					name: prize.name,
					image_url: prize.imageUrl,
					prize_template_id: prize.prizeTemplateId,
					eligible_kind: prize.eligibleCounts.isBonus() ? 'bonus' : 'regular',
					eligible_total: prize.eligibleCounts.total,
					eligible_senior: prize.eligibleCounts.isRegular() ? prize.eligibleCounts.senior : null,
					eligible_junior: prize.eligibleCounts.isRegular() ? prize.eligibleCounts.junior : null,
					is_drawn: prize.isDrawn ? 1 : 0,
				};
				await trx.insertInto('raffle_prize').values(newPrize).execute();
			}
		}
	}

	private async syncWinners(trx: KyselyDatabase, raffle: Raffle): Promise<void> {
		const existingRows = await trx
			.selectFrom('winner_record')
			.select(['id', 'participant_id', 'raffle_prize_id'])
			.where('raffle_id', '=', raffle.id)
			.execute();

		const existingSet = new Set(existingRows.map((r) => `${r.participant_id}-${r.raffle_prize_id}`));

		for (const winner of raffle.winners) {
			const key = `${winner.participantId}-${winner.rafflePrizeId}`;
			if (!existingSet.has(key)) {
				const newWinner: NewWinnerRecord = {
					raffle_id: raffle.id,
					raffle_prize_id: winner.rafflePrizeId,
					participant_id: winner.participantId,
					drawn_group: winner.drawnGroup,
				};
				await trx.insertInto('winner_record').values(newWinner).execute();
			}
		}
	}

	private toParticipant(row: RaffleParticipantRow): RaffleParticipant {
		return RaffleParticipant.create({
			id: row.id,
			employeeId: row.employee_id,
			staffNumber: row.staff_number,
			name: row.name,
			department: row.department,
			role: row.role as EmployeeRole,
			tags: row.tags ? JSON.parse(row.tags) : [],
		});
	}

	private toPrize(row: RafflePrizeRow): RafflePrize {
		const eligibleCounts = row.eligible_kind === 'bonus'
			? BonusEligibleCounts.create(row.eligible_total)
			: RegularEligibleCounts.hydrate(row.eligible_total, row.eligible_senior ?? 0, row.eligible_junior ?? 0);

		return RafflePrize.create({
			id: row.id,
			rank: PrizeRank.fromString(row.rank),
			name: row.name,
			imageUrl: row.image_url,
			eligibleCounts,
			isDrawn: row.is_drawn === 1,
			prizeTemplateId: row.prize_template_id ?? undefined,
		});
	}

	private toWinner(row: WinnerRecordRow): WinnerRecord {
		return WinnerRecord.create({
			id: row.id,
			rafflePrizeId: row.raffle_prize_id,
			participantId: row.participant_id,
			drawnGroup: row.drawn_group as DrawnGroup,
			createdAt: new Date(row.created_at),
		});
	}
}
