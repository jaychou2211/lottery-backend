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
// Prize Template Table (prize_template)
// =====================================================
export interface PrizeTemplateTable {
	id: Generated<number>;
	name: string;
	prize_level: string;
	image_url: string;
	created_at: ColumnType<string, string | undefined, never>;
	updated_at: ColumnType<string, string | undefined, string | undefined>;
}

export type PrizeTemplateRow = Selectable<PrizeTemplateTable>;
export type NewPrizeTemplate = Insertable<PrizeTemplateTable>;
export type PrizeTemplateUpdate = Updateable<PrizeTemplateTable>;

// =====================================================
// Database Schema
// =====================================================
export interface Database {
	_smoke_test: SmokeTestTable;
	prize_template: PrizeTemplateTable;
}
