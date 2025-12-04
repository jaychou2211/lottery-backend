import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

/**
 * Kysely Database Schema Definition
 *
 * Minimal smoke test schema to verify:
 * - DB connection works
 * - Migration mechanism works
 *
 * Business tables will be added incrementally via TDD
 */

// =====================================================
// Smoke Test Table (_smoke_test)
// =====================================================
export interface SmokeTestTable {
	id: Generated<number>;
	attr1: string;
	attr2: string | null;
	created_at: ColumnType<string, string | undefined, never>;
}

export type SmokeTest = Selectable<SmokeTestTable>;
export type NewSmokeTest = Insertable<SmokeTestTable>;
export type SmokeTestUpdate = Updateable<SmokeTestTable>;

// =====================================================
// Employee Table (employee)
// =====================================================
export interface EmployeeTable {
	id: Generated<number>;
	staff_number: string;
	name: string;
	department: string;
	/** EmployeeRole: 'SENIOR' | 'JUNIOR' */
	role: string;
	created_at: ColumnType<string, string | undefined, never>;
	updated_at: ColumnType<string, string | undefined, string | undefined>;
	deleted_at: string | null;
}

export type EmployeeRow = Selectable<EmployeeTable>;
export type NewEmployee = Insertable<EmployeeTable>;
export type EmployeeUpdate = Updateable<EmployeeTable>;

// =====================================================
// Prize Template Table (prize_template)
// =====================================================
export interface PrizeTemplateTable {
	id: Generated<number>;
	name: string;
	prize_level: string;
	image_url: string;
	/** Number of senior winners */
	senior: number;
	/** Number of junior winners */
	junior: number;
	created_at: ColumnType<string, string | undefined, never>;
	updated_at: ColumnType<string, string | undefined, string | undefined>;
	deleted_at: string | null;
}

export type PrizeTemplateRow = Selectable<PrizeTemplateTable>;
export type NewPrizeTemplate = Insertable<PrizeTemplateTable>;
export type PrizeTemplateUpdate = Updateable<PrizeTemplateTable>;

// =====================================================
// Raffle Table (raffle)
// =====================================================
export interface RaffleTable {
	id: Generated<number>;
	name: string;
	/** RaffleStatus: 'DRAFT' | 'READY' | 'IN_PROGRESS' | 'BONUS' | 'COMPLETED' */
	status: string;
	created_at: ColumnType<string, string | undefined, never>;
	updated_at: ColumnType<string, string | undefined, string | undefined>;
}

export type RaffleRow = Selectable<RaffleTable>;
export type NewRaffle = Insertable<RaffleTable>;
export type RaffleUpdate = Updateable<RaffleTable>;

// =====================================================
// Raffle Participant Table (raffle_participant)
// =====================================================
export interface RaffleParticipantTable {
	id: Generated<number>;
	raffle_id: number;
	employee_id: number;
	staff_number: string;
	name: string;
	department: string;
	/** EmployeeRole: 'SENIOR' | 'JUNIOR' */
	role: string;
	attended: number; // SQLite boolean
	created_at: ColumnType<string, string | undefined, never>;
}

export type RaffleParticipantRow = Selectable<RaffleParticipantTable>;
export type NewRaffleParticipant = Insertable<RaffleParticipantTable>;
export type RaffleParticipantUpdate = Updateable<RaffleParticipantTable>;

// =====================================================
// Raffle Prize Table (raffle_prize)
// =====================================================
export interface RafflePrizeTable {
	id: Generated<number>;
	raffle_id: number;
	rank: number;
	name: string;
	prize_level: string;
	image_url: string;
	prize_template_id: number | null;
	/** 'regular' | 'bonus' */
	eligible_kind: string;
	eligible_total: number;
	eligible_senior: number | null;
	eligible_junior: number | null;
	is_drawn: number; // SQLite boolean
	created_at: ColumnType<string, string | undefined, never>;
}

export type RafflePrizeRow = Selectable<RafflePrizeTable>;
export type NewRafflePrize = Insertable<RafflePrizeTable>;
export type RafflePrizeUpdate = Updateable<RafflePrizeTable>;

// =====================================================
// Winner Record Table (winner_record)
// =====================================================
export interface WinnerRecordTable {
	id: Generated<number>;
	raffle_id: number;
	raffle_prize_id: number;
	participant_id: number;
	/** DrawnGroup: 'SENIOR' | 'JUNIOR' | 'ALL' */
	drawn_group: string;
	created_at: ColumnType<string, string | undefined, never>;
}

export type WinnerRecordRow = Selectable<WinnerRecordTable>;
export type NewWinnerRecord = Insertable<WinnerRecordTable>;

// =====================================================
// Database Schema
// =====================================================
export interface Database {
	_smoke_test: SmokeTestTable;
	employee: EmployeeTable;
	prize_template: PrizeTemplateTable;
	raffle: RaffleTable;
	raffle_participant: RaffleParticipantTable;
	raffle_prize: RafflePrizeTable;
	winner_record: WinnerRecordTable;
}
