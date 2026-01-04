import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { createTestApp, closeTestApp, type TestApp } from './test-utils';
import type { KyselyDatabase } from '../src/database';

interface PrizeFixture {
	name: string;
	rank: string;
	imageUrl: string;
	senior: number;
	junior: number;
}

function toCsvContent(rows: PrizeFixture[]): string {
	const header = 'name,rank,imageUrl,senior,junior';
	const lines = rows.map((r) => `${r.name},${r.rank},${r.imageUrl},${r.senior},${r.junior}`);
	return [header, ...lines].join('\n');
}

describe('PUT /prizes - CSV Sync', () => {
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
		// Clean up prize templates before each test
		await db.deleteFrom('prize_template').execute();
	});

	it('should create, update, and delete prizes based on CSV diff', async () => {
		// ========================================
		// Fixture: Declare the test scenario
		// ========================================

		const toBeDeleted: PrizeFixture[] = [
			{ name: '待刪除獎品A', rank: '1-99', imageUrl: 'https://example.com/del-a.jpg', senior: 1, junior: 1 },
			{ name: '待刪除獎品B', rank: '2-99', imageUrl: 'https://example.com/del-b.jpg', senior: 2, junior: 2 },
		];

		const toBeUpdated = {
			before: [
				{ name: '舊獎品A', rank: '1-1', imageUrl: 'https://example.com/old-a.jpg', senior: 1, junior: 1 },
				{ name: '舊獎品B', rank: '2-1', imageUrl: 'https://example.com/old-b.jpg', senior: 2, junior: 2 },
			],
			after: [
				{ name: '新獎品A', rank: '1-1', imageUrl: 'https://example.com/new-a.jpg', senior: 3, junior: 3 },
				{ name: '新獎品B', rank: '2-1', imageUrl: 'https://example.com/new-b.jpg', senior: 4, junior: 4 },
			],
		};

		const toBeCreated: PrizeFixture[] = [
			{ name: '新獎品C', rank: '3-1', imageUrl: 'https://example.com/new-c.jpg', senior: 5, junior: 5 },
			{ name: '新獎品D', rank: '4-1', imageUrl: 'https://example.com/new-d.jpg', senior: 6, junior: 6 },
			{ name: '新獎品E', rank: '5-1', imageUrl: 'https://example.com/new-e.jpg', senior: 7, junior: 7 },
		];

		// ========================================
		// Setup: Seed DB with initial state
		// ========================================

		const initialDbState = [...toBeDeleted, ...toBeUpdated.before];

		for (const prize of initialDbState) {
			await db
				.insertInto('prize_template')
				.values({
					name: prize.name,
					rank: prize.rank,
					image_url: prize.imageUrl,
					senior: prize.senior,
					junior: prize.junior,
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
			.put('/api/prizes')
			.attach('file', Buffer.from(csvContent), 'prizes.csv')
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

		const finalPrizes = await db
			.selectFrom('prize_template')
			.selectAll()
			.where('deleted_at', 'is', null)
			.orderBy('rank')
			.execute();

		const expectedFinal = [...toBeCreated, ...toBeUpdated.after].sort((a, b) =>
			a.rank.localeCompare(b.rank),
		);

		expect(finalPrizes).toHaveLength(expectedFinal.length);

		for (let i = 0; i < expectedFinal.length; i++) {
			expect(finalPrizes[i]).toMatchObject({
				name: expectedFinal[i].name,
				rank: expectedFinal[i].rank,
				image_url: expectedFinal[i].imageUrl,
				senior: expectedFinal[i].senior,
				junior: expectedFinal[i].junior,
			});
		}

		// Verify deleted prizes are soft-deleted
		const deletedPrizes = await db
			.selectFrom('prize_template')
			.selectAll()
			.where('deleted_at', 'is not', null)
			.execute();

		expect(deletedPrizes).toHaveLength(toBeDeleted.length);
	});

	it('should delete all prizes when CSV is empty', async () => {
		// ========================================
		// Fixture
		// ========================================

		const toBeDeleted: PrizeFixture[] = [
			{ name: '獎品A', rank: '1-1', imageUrl: 'https://example.com/a.jpg', senior: 1, junior: 1 },
			{ name: '獎品B', rank: '2-1', imageUrl: 'https://example.com/b.jpg', senior: 2, junior: 2 },
		];

		// ========================================
		// Setup: Seed DB
		// ========================================

		for (const prize of toBeDeleted) {
			await db
				.insertInto('prize_template')
				.values({
					name: prize.name,
					rank: prize.rank,
					image_url: prize.imageUrl,
					senior: prize.senior,
					junior: prize.junior,
				})
				.execute();
		}

		// ========================================
		// Act: Sync with empty CSV (header only)
		// ========================================

		const emptyCsv = 'name,rank,imageUrl,senior,junior\n';

		const response = await request(app.getHttpServer())
			.put('/api/prizes')
			.attach('file', Buffer.from(emptyCsv), 'prizes.csv')
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
			.selectFrom('prize_template')
			.selectAll()
			.where('deleted_at', 'is', null)
			.execute();

		expect(remaining).toHaveLength(0);
	});

	it('should reject CSV with duplicate rank', async () => {
		// ========================================
		// Fixture: CSV with duplicate rank
		// ========================================

		const csvWithDuplicates: PrizeFixture[] = [
			{ name: '獎品A', rank: '1-1', imageUrl: 'https://example.com/a.jpg', senior: 1, junior: 1 },
			{ name: '獎品B', rank: '1-1', imageUrl: 'https://example.com/b.jpg', senior: 2, junior: 2 },
		];

		const csvContent = toCsvContent(csvWithDuplicates);

		// ========================================
		// Act & Assert
		// ========================================

		const response = await request(app.getHttpServer())
			.put('/api/prizes')
			.attach('file', Buffer.from(csvContent), 'prizes.csv')
			.expect(400);

		expect(response.body.code).toBe('INVALID_CSV_DATA');
		expect(response.body.message).toContain('Duplicate rank');
	});

	it('should reject CSV with invalid rank format', async () => {
		// ========================================
		// Fixture: CSV with invalid rank
		// ========================================

		const csvContent = `name,rank,imageUrl,senior,junior
獎品A,INVALID,https://example.com/a.jpg,1,1`;

		// ========================================
		// Act & Assert
		// ========================================

		const response = await request(app.getHttpServer())
			.put('/api/prizes')
			.attach('file', Buffer.from(csvContent), 'prizes.csv')
			.expect(400);

		expect(response.body.code).toBe('INVALID_CSV_DATA');
		expect(response.body.message).toContain('Invalid rank format');
	});

	it('should reject CSV with invalid senior/junior values', async () => {
		// ========================================
		// Fixture: CSV with negative senior value
		// ========================================

		const csvContent = `name,rank,imageUrl,senior,junior
獎品A,1-1,https://example.com/a.jpg,-1,1`;

		// ========================================
		// Act & Assert
		// ========================================

		const response = await request(app.getHttpServer())
			.put('/api/prizes')
			.attach('file', Buffer.from(csvContent), 'prizes.csv')
			.expect(400);

		expect(response.body.code).toBe('INVALID_CSV_DATA');
		expect(response.body.message).toContain('Invalid senior value');
	});
});
