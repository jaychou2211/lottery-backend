import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { createTestApp, closeTestApp, type TestApp } from './test-utils';
import type { KyselyDatabase } from '../src/database';

interface EmployeeFixture {
	staffNumber: string;
	name: string;
	department: string;
	role: 'SENIOR' | 'JUNIOR';
}

function toCsvContent(rows: EmployeeFixture[]): string {
	const header = 'staffNumber,name,department,role';
	const lines = rows.map((r) => `${r.staffNumber},${r.name},${r.department},${r.role}`);
	return [header, ...lines].join('\n');
}

describe('PUT /employees - CSV Sync', () => {
	let testApp: TestApp;
	let app: INestApplication;
	let db: KyselyDatabase;

	beforeAll(async () => {
		testApp = await createTestApp();
		app = testApp.app;
		db = testApp.db;
	});

	afterAll(async () => {
		await closeTestApp(testApp);
	});

	beforeEach(async () => {
		// Clean up employees before each test
		await db.deleteFrom('employee').execute();
	});

	it('should create, update, and delete employees based on CSV diff', async () => {
		// ========================================
		// Fixture: Declare the test scenario
		// ========================================

		const toBeDeleted: EmployeeFixture[] = [
			{ staffNumber: 'D001', name: '待刪除員工A', department: '行政部', role: 'JUNIOR' },
			{ staffNumber: 'D002', name: '待刪除員工B', department: '行政部', role: 'SENIOR' },
		];

		const toBeUpdated = {
			before: [
				{ staffNumber: 'U001', name: '舊名字A', department: '舊部門A', role: 'JUNIOR' as const },
				{ staffNumber: 'U002', name: '舊名字B', department: '舊部門B', role: 'JUNIOR' as const },
			],
			after: [
				{ staffNumber: 'U001', name: '新名字A', department: '新部門A', role: 'SENIOR' as const },
				{ staffNumber: 'U002', name: '新名字B', department: '新部門B', role: 'SENIOR' as const },
			],
		};

		const toBeCreated: EmployeeFixture[] = [
			{ staffNumber: 'C001', name: '新員工A', department: '研發部', role: 'SENIOR' },
			{ staffNumber: 'C002', name: '新員工B', department: '研發部', role: 'JUNIOR' },
			{ staffNumber: 'C003', name: '新員工C', department: '行銷部', role: 'JUNIOR' },
		];

		// ========================================
		// Setup: Seed DB with initial state
		// ========================================

		const initialDbState = [...toBeDeleted, ...toBeUpdated.before];

		for (const emp of initialDbState) {
			await db
				.insertInto('employee')
				.values({
					staff_number: emp.staffNumber,
					name: emp.name,
					department: emp.department,
					role: emp.role,
				})
				.execute();
		}

		// ========================================
		// Prepare: Build CSV content
		// ========================================

		const csvContent = toCsvContent([...toBeUpdated.after, ...toBeCreated]);

		// ========================================
		// Act: Call the sync API
		// ========================================

		const response = await request(app.getHttpServer())
			.put('/employees')
			.attach('file', Buffer.from(csvContent), 'employees.csv')
			.expect(200);

		// ========================================
		// Assert: Verify sync result
		// ========================================

		expect(response.body).toEqual({
			created: toBeCreated.length,
			updated: toBeUpdated.before.length,
			deleted: toBeDeleted.length,
			total: toBeUpdated.after.length + toBeCreated.length,
		});

		// ========================================
		// Assert: Verify final DB state
		// ========================================

		const finalEmployees = await db
			.selectFrom('employee')
			.selectAll()
			.where('deleted_at', 'is', null)
			.orderBy('staff_number')
			.execute();

		const expectedFinal = [...toBeCreated, ...toBeUpdated.after].sort((a, b) =>
			a.staffNumber.localeCompare(b.staffNumber),
		);

		expect(finalEmployees).toHaveLength(expectedFinal.length);

		for (let i = 0; i < expectedFinal.length; i++) {
			expect(finalEmployees[i]).toMatchObject({
				staff_number: expectedFinal[i].staffNumber,
				name: expectedFinal[i].name,
				department: expectedFinal[i].department,
				role: expectedFinal[i].role,
			});
		}

		// Verify deleted employees are soft-deleted
		const deletedEmployees = await db
			.selectFrom('employee')
			.selectAll()
			.where('deleted_at', 'is not', null)
			.execute();

		expect(deletedEmployees).toHaveLength(toBeDeleted.length);
	});

	it('should delete all employees when CSV is empty', async () => {
		// ========================================
		// Fixture
		// ========================================

		const toBeDeleted: EmployeeFixture[] = [
			{ staffNumber: 'E001', name: '員工A', department: '部門A', role: 'SENIOR' },
			{ staffNumber: 'E002', name: '員工B', department: '部門B', role: 'JUNIOR' },
		];

		// ========================================
		// Setup: Seed DB
		// ========================================

		for (const emp of toBeDeleted) {
			await db
				.insertInto('employee')
				.values({
					staff_number: emp.staffNumber,
					name: emp.name,
					department: emp.department,
					role: emp.role,
				})
				.execute();
		}

		// ========================================
		// Act: Sync with empty CSV (header only)
		// ========================================

		const emptyCsv = 'staffNumber,name,department,role\n';

		const response = await request(app.getHttpServer())
			.put('/employees')
			.attach('file', Buffer.from(emptyCsv), 'employees.csv')
			.expect(200);

		// ========================================
		// Assert
		// ========================================

		expect(response.body).toEqual({
			created: 0,
			updated: 0,
			deleted: toBeDeleted.length,
			total: 0,
		});

		const remaining = await db
			.selectFrom('employee')
			.selectAll()
			.where('deleted_at', 'is', null)
			.execute();

		expect(remaining).toHaveLength(0);
	});

	it('should reject CSV with duplicate staffNumber', async () => {
		// ========================================
		// Fixture: CSV with duplicate staffNumber
		// ========================================

		const csvWithDuplicates = [
			{ staffNumber: 'DUP001', name: '員工A', department: '部門A', role: 'SENIOR' as const },
			{ staffNumber: 'DUP001', name: '員工B', department: '部門B', role: 'JUNIOR' as const },
		];

		const csvContent = toCsvContent(csvWithDuplicates);

		// ========================================
		// Act & Assert
		// ========================================

		const response = await request(app.getHttpServer())
			.put('/employees')
			.attach('file', Buffer.from(csvContent), 'employees.csv')
			.expect(400);

		expect(response.body.code).toBe('INVALID_CSV_DATA');
		expect(response.body.message).toContain('Duplicate staffNumber');
	});

	it('should reject CSV with invalid role', async () => {
		// ========================================
		// Fixture: CSV with invalid role
		// ========================================

		const csvContent = `staffNumber,name,department,role
E001,員工A,部門A,INVALID_ROLE`;

		// ========================================
		// Act & Assert
		// ========================================

		const response = await request(app.getHttpServer())
			.put('/employees')
			.attach('file', Buffer.from(csvContent), 'employees.csv')
			.expect(400);

		expect(response.body.code).toBe('INVALID_CSV_DATA');
		expect(response.body.message).toContain('Invalid role');
	});
});
