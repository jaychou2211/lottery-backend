import { Injectable } from '@nestjs/common';

import {
	InjectKysely,
	type KyselyDatabase,
} from '../database';
import {
	RaffleStatus,
	EmployeeRole,
	DrawnGroup,
	PrizeRank,
} from '../domain/shared';

// ============================================================
// DTOs
// ============================================================

export interface RaffleListItemDto {
	id: number;
	name: string;
	status: RaffleStatus;
	participantCount: number;
	prizeCount: number;
	winnerCount: number;
}

export interface ParticipantDto {
	id: number;
	employeeId: number;
	staffNumber: string;
	name: string;
	department: string;
	role: EmployeeRole;
	tags: string[];
}

export interface PrizeDto {
	id: number;
	rank: string;
	name: string;
	prizeLevel: string;
	imageUrl: string;
	eligibleCounts: {
		kind: 'regular' | 'bonus';
		total: number;
		senior?: number;
		junior?: number;
	};
	isDrawn: boolean;
	prizeTemplateId: number | null;
}

export interface WinnerDto {
	id: number;
	rafflePrizeId: number;
	participantId: number;
	drawnGroup: DrawnGroup;
	createdAt: string;
}

export interface RaffleDetailDto {
	id: number;
	name: string;
	status: RaffleStatus;
	participants?: ParticipantDto[];
	prizes?: PrizeDto[];
	winners?: WinnerDto[];
}

export interface DrawResultWinnerDto {
	participantId: number;
	staffNumber: string;
	name: string;
	department: string;
	role: EmployeeRole;
	drawnGroup: DrawnGroup;
}

export interface DrawResultDto {
	winners: DrawResultWinnerDto[];
	prize: {
		id: number;
		name: string;
		rank: string;
		prizeLevel: string;
		imageUrl: string;
	};
	drawnAt: string;
}

export interface ParticipantStatusDto {
	participant: {
		id: number;
		staffNumber: string;
		name: string;
		department: string;
		role: EmployeeRole;
	};
	wonPrizes: Array<{
		prizeId: number;
		prizeName: string;
		rank: string;
		prizeLevel: string;
		drawnAt: string;
	}>;
}

export type RaffleDetailInclude = 'participants' | 'prizes' | 'winners';

export interface RaffleDetailOptions {
	include?: RaffleDetailInclude[];
}

export interface RaffleListFilters {
	status?: RaffleStatus;
}

@Injectable()
export class RaffleProjection {
	constructor(@InjectKysely() private readonly db: KyselyDatabase) {}

	async getList(filters?: RaffleListFilters): Promise<RaffleListItemDto[]> {
		let query = this.db
			.selectFrom('raffle')
			.select(['raffle.id', 'raffle.name', 'raffle.status'])
			.select((eb) => [
				eb
					.selectFrom('raffle_participant')
					.select(eb.fn.countAll<number>().as('count'))
					.whereRef('raffle_participant.raffle_id', '=', 'raffle.id')
					.where('raffle_participant.deleted_at', 'is', null)
					.as('participantCount'),
				eb
					.selectFrom('raffle_prize')
					.select(eb.fn.countAll<number>().as('count'))
					.whereRef('raffle_prize.raffle_id', '=', 'raffle.id')
					.as('prizeCount'),
				eb
					.selectFrom('winner_record')
					.select(eb.fn.countAll<number>().as('count'))
					.whereRef('winner_record.raffle_id', '=', 'raffle.id')
					.as('winnerCount'),
			]);

		if (filters?.status) {
			query = query.where('raffle.status', '=', filters.status);
		}

		const rows = await query.orderBy('raffle.id', 'desc').execute();

		return rows.map((row) => ({
			id: row.id,
			name: row.name,
			status: row.status as RaffleStatus,
			participantCount: Number(row.participantCount ?? 0),
			prizeCount: Number(row.prizeCount ?? 0),
			winnerCount: Number(row.winnerCount ?? 0),
		}));
	}

	async getDetail(id: number, options?: RaffleDetailOptions): Promise<RaffleDetailDto | null> {
		const raffle = await this.db
			.selectFrom('raffle')
			.select(['id', 'name', 'status'])
			.where('id', '=', id)
			.executeTakeFirst();

		if (!raffle) return null;

		const include = options?.include ?? ['participants', 'prizes', 'winners'];

		const result: RaffleDetailDto = {
			id: raffle.id,
			name: raffle.name,
			status: raffle.status as RaffleStatus,
		};

		if (include.includes('participants')) {
			result.participants = await this.getParticipants(id);
		}

		if (include.includes('prizes')) {
			result.prizes = await this.getPrizes(id);
		}

		if (include.includes('winners')) {
			result.winners = await this.getWinners(id);
		}

		return result;
	}

	async getLatestDrawResult(raffleId: number): Promise<DrawResultDto | null> {
		const latestPrize = await this.db
			.selectFrom('winner_record')
			.innerJoin('raffle_prize', 'raffle_prize.id', 'winner_record.raffle_prize_id')
			.select([
				'raffle_prize.id as prize_id',
				'raffle_prize.name as prize_name',
				'raffle_prize.rank',
				'raffle_prize.image_url',
				'winner_record.created_at',
			])
			.where('winner_record.raffle_id', '=', raffleId)
			.orderBy('winner_record.created_at', 'desc')
			.limit(1)
			.executeTakeFirst();

		if (!latestPrize) return null;

		const winners = await this.db
			.selectFrom('winner_record')
			.innerJoin('raffle_participant', 'raffle_participant.id', 'winner_record.participant_id')
			.select([
				'winner_record.participant_id',
				'winner_record.drawn_group',
				'raffle_participant.staff_number',
				'raffle_participant.name as participant_name',
				'raffle_participant.department',
				'raffle_participant.role',
			])
			.where('winner_record.raffle_prize_id', '=', latestPrize.prize_id)
			.execute();

		const prizeRank = PrizeRank.fromString(latestPrize.rank);

		return {
			winners: winners.map((w) => ({
				participantId: w.participant_id,
				staffNumber: w.staff_number,
				name: w.participant_name,
				department: w.department,
				role: w.role as EmployeeRole,
				drawnGroup: w.drawn_group as DrawnGroup,
			})),
			prize: {
				id: latestPrize.prize_id,
				name: latestPrize.prize_name,
				rank: latestPrize.rank,
				prizeLevel: prizeRank.levelName,
				imageUrl: latestPrize.image_url,
			},
			drawnAt: latestPrize.created_at,
		};
	}

	async getParticipantStatus(raffleId: number, staffNumber: string): Promise<ParticipantStatusDto | null> {
		const participant = await this.db
			.selectFrom('raffle_participant')
			.select(['id', 'staff_number', 'name', 'department', 'role'])
			.where('raffle_id', '=', raffleId)
			.where('staff_number', '=', staffNumber)
			.where('deleted_at', 'is', null)
			.executeTakeFirst();

		if (!participant) return null;

		const wonPrizes = await this.db
			.selectFrom('winner_record')
			.innerJoin('raffle_prize', 'raffle_prize.id', 'winner_record.raffle_prize_id')
			.select([
				'raffle_prize.id as prize_id',
				'raffle_prize.name as prize_name',
				'raffle_prize.rank',
				'winner_record.created_at',
			])
			.where('winner_record.participant_id', '=', participant.id)
			.orderBy('winner_record.created_at', 'desc')
			.execute();

		return {
			participant: {
				id: participant.id,
				staffNumber: participant.staff_number,
				name: participant.name,
				department: participant.department,
				role: participant.role as EmployeeRole,
			},
			wonPrizes: wonPrizes.map((p) => {
				const prizeRank = PrizeRank.fromString(p.rank);
				return {
					prizeId: p.prize_id,
					prizeName: p.prize_name,
					rank: p.rank,
					prizeLevel: prizeRank.levelName,
					drawnAt: p.created_at,
				};
			}),
		};
	}

	private async getParticipants(raffleId: number): Promise<ParticipantDto[]> {
		const rows = await this.db
			.selectFrom('raffle_participant')
			.selectAll()
			.where('raffle_id', '=', raffleId)
			.where('deleted_at', 'is', null)
			.execute();

		return rows.map((row) => ({
			id: row.id,
			employeeId: row.employee_id,
			staffNumber: row.staff_number,
			name: row.name,
			department: row.department,
			role: row.role as EmployeeRole,
			tags: row.tags ? JSON.parse(row.tags) : [],
		}));
	}

	private async getPrizes(raffleId: number): Promise<PrizeDto[]> {
		const rows = await this.db
			.selectFrom('raffle_prize')
			.selectAll()
			.where('raffle_id', '=', raffleId)
			.orderBy('rank')
			.execute();

		return rows.map((row) => {
			const prizeRank = PrizeRank.fromString(row.rank);
			return {
				id: row.id,
				rank: row.rank,
				name: row.name,
				prizeLevel: prizeRank.levelName,
				imageUrl: row.image_url,
				eligibleCounts: row.eligible_kind === 'bonus'
					? { kind: 'bonus' as const, total: row.eligible_total }
					: {
						kind: 'regular' as const,
						total: row.eligible_total,
						senior: row.eligible_senior ?? 0,
						junior: row.eligible_junior ?? 0,
					},
				isDrawn: row.is_drawn === 1,
				prizeTemplateId: row.prize_template_id,
			};
		});
	}

	private async getWinners(raffleId: number): Promise<WinnerDto[]> {
		const rows = await this.db
			.selectFrom('winner_record')
			.selectAll()
			.where('raffle_id', '=', raffleId)
			.execute();

		return rows.map((row) => ({
			id: row.id,
			rafflePrizeId: row.raffle_prize_id,
			participantId: row.participant_id,
			drawnGroup: row.drawn_group as DrawnGroup,
			createdAt: row.created_at,
		}));
	}
}
