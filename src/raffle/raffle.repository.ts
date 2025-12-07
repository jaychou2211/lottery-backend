import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';

import {
	InjectKysely,
	type KyselyDatabase,
	type RafflePrizeRow,
	type NewRaffle,
	type NewRaffleParticipant,
	type NewRafflePrize,
	type NewWinnerRecord,
} from '../database';
import { ConcurrencyError, NotFoundError } from './errors';
import {
	Raffle,
	Prize,
	EligibilityPool,
	type ParticipantEligibility,
} from '../domain/raffle';
import {
	RaffleStatus,
	EmployeeRole,
	RegularEligibleCounts,
	BonusEligibleCounts,
	PrizeRank,
} from '../domain/shared';

type Transaction = KyselyDatabase;

@Injectable()
export class RaffleRepository {
	constructor(@InjectKysely() private readonly db: KyselyDatabase) {}

	async create(name: string): Promise<number> {
		return this.db.transaction().execute(async (trx) => {
			const newRaffle: NewRaffle = {
				name,
				status: RaffleStatus.DRAFT,
				version: 1,
			};
			const result = await trx
				.insertInto('raffle')
				.values(newRaffle)
				.returning(['id'])
				.executeTakeFirstOrThrow();

			const raffleId = result.id;

			await this.snapshotEmployees(trx, raffleId);
			await this.snapshotPrizeTemplates(trx, raffleId);
			await this.loadAggregate(trx, raffleId);

			return raffleId;
		});
	}

	async execute(id: number, fn: (raffle: Raffle) => Raffle): Promise<void> {
		await this.db.transaction().execute(async (trx) => {
			const raffle = await this.loadAggregate(trx, id);
			const updated = fn(raffle);
			await this.save(trx, raffle, updated);
		});
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.db
			.deleteFrom('raffle')
			.where('id', '=', id)
			.executeTakeFirst();
		return result.numDeletedRows > 0n;
	}

	private async snapshotEmployees(trx: Transaction, raffleId: number): Promise<void> {
		const employees = await trx
			.selectFrom('employee')
			.select(['id', 'staff_number', 'name', 'department', 'role'])
			.where('deleted_at', 'is', null)
			.execute();

		if (employees.length === 0) return;

		const participants: NewRaffleParticipant[] = employees.map((emp) => ({
			raffle_id: raffleId,
			employee_id: emp.id,
			staff_number: emp.staff_number,
			name: emp.name,
			department: emp.department,
			role: emp.role,
			tags: null,
		}));

		await trx.insertInto('raffle_participant').values(participants).execute();
	}

	private async snapshotPrizeTemplates(trx: Transaction, raffleId: number): Promise<void> {
		const templates = await trx
			.selectFrom('prize_template')
			.select(['id', 'name', 'rank', 'image_url', 'senior', 'junior'])
			.where('deleted_at', 'is', null)
			.orderBy('rank')
			.execute();

		if (templates.length === 0) return;

		const prizes: NewRafflePrize[] = templates.map((t) => ({
			raffle_id: raffleId,
			rank: t.rank,
			name: t.name,
			image_url: t.image_url,
			prize_template_id: t.id,
			eligible_kind: 'regular',
			eligible_total: t.senior + t.junior,
			eligible_senior: t.senior,
			eligible_junior: t.junior,
			is_drawn: false,
		}));

		await trx.insertInto('raffle_prize').values(prizes).execute();
	}

	private async loadAggregate(trx: Transaction, id: number): Promise<Raffle> {
		const [raffleRow, participantRows, prizeRows, wonIds] = await Promise.all([
			trx
				.selectFrom('raffle')
				.select(['id', 'name', 'status', 'version'])
				.where('id', '=', id)
				.executeTakeFirst(),
			trx
				.selectFrom('raffle_participant')
				.select(['id', 'role'])
				.where('raffle_id', '=', id)
				.where('deleted_at', 'is', null)
				.execute(),
			trx
				.selectFrom('raffle_prize')
				.selectAll()
				.where('raffle_id', '=', id)
				.orderBy('rank')
				.execute(),
			trx
				.selectFrom('winner_record')
				.select(['participant_id'])
				.where('raffle_id', '=', id)
				.execute()
				.then((rows) => new Set(rows.map((r) => r.participant_id))),
		]);

		if (!raffleRow) {
			throw new NotFoundError('Raffle', id);
		}

		const participants: ParticipantEligibility[] = participantRows.map((p) => ({
			id: p.id,
			role: p.role as EmployeeRole,
		}));

		const eligibilityPool = EligibilityPool.create(participants, wonIds);
		const prizes = prizeRows.map((p) => this.toPrize(p));

		return Raffle.create({
			id: raffleRow.id,
			name: raffleRow.name,
			version: raffleRow.version,
			status: raffleRow.status as RaffleStatus,
			eligibilityPool,
			prizes,
		});
	}

	private async save(trx: Transaction, original: Raffle, updated: Raffle): Promise<void> {
		const result = await trx
			.updateTable('raffle')
			.set({
				status: updated.status,
				version: original.version + 1,
				updated_at: sql`CURRENT_TIMESTAMP`,
			})
			.where('id', '=', updated.id)
			.where('version', '=', original.version)
			.executeTakeFirst();

		if (result.numUpdatedRows === 0n) {
			throw new ConcurrencyError();
		}

		await this.syncPrizes(trx, updated);
		await this.persistEvents(trx, updated);
	}

	private async syncPrizes(trx: Transaction, raffle: Raffle): Promise<void> {
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
				if (existing.is_drawn !== prize.isDrawn) {
					await trx
						.updateTable('raffle_prize')
						.set({ is_drawn: prize.isDrawn })
						.where('id', '=', existing.id)
						.execute();
				}
			} else {
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
					is_drawn: prize.isDrawn,
				};
				await trx.insertInto('raffle_prize').values(newPrize).execute();
			}
		}
	}

	private async persistEvents(trx: Transaction, raffle: Raffle): Promise<void> {
		if (raffle.pendingEvents.length === 0) return;

		const winnerRecords: NewWinnerRecord[] = raffle.pendingEvents.map((event) => ({
			raffle_id: raffle.id,
			raffle_prize_id: event.prizeId,
			participant_id: event.participantId,
			drawn_group: event.drawnGroup,
		}));

		await trx.insertInto('winner_record').values(winnerRecords).execute();
	}

	private toPrize(row: RafflePrizeRow): Prize {
		const eligibleCounts = row.eligible_kind === 'bonus'
			? BonusEligibleCounts.create(row.eligible_total)
			: RegularEligibleCounts.hydrate(row.eligible_total, row.eligible_senior ?? 0, row.eligible_junior ?? 0);

		return Prize.create({
			id: row.id,
			rank: PrizeRank.fromString(row.rank),
			name: row.name,
			imageUrl: row.image_url,
			eligibleCounts,
			isDrawn: row.is_drawn,
			prizeTemplateId: row.prize_template_id ?? undefined,
		});
	}
}
