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
}

export type EmployeeRow = Selectable<EmployeeTable>;
export type NewEmployee = Insertable<EmployeeTable>;
export type EmployeeUpdate = Updateable<EmployeeTable>;

// =====================================================
// Database Schema
// =====================================================
export interface Database {
	_smoke_test: SmokeTestTable;
	employee: EmployeeTable;
}
