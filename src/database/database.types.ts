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
// Database Schema
// =====================================================
export interface Database {
	_smoke_test: SmokeTestTable;
}
