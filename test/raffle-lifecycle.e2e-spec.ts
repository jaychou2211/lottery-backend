import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createTestApp, closeTestApp, type TestApp } from './test-utils';

/**
 * Raffle Lifecycle E2E Test
 *
 * Tests the complete raffle lifecycle:
 * DRAFT → READY → IN_PROGRESS → BONUS → COMPLETED
 */
describe('Raffle Lifecycle (e2e)', () => {
	let testApp: TestApp;
	let app: INestApplication;
	let raffleId: number;
	let employeeCount: number;
	let prizeCount: number;

	beforeAll(async () => {
		testApp = await createTestApp();
		app = testApp.app;
	});

	afterAll(async () => {
		await closeTestApp(testApp);
	});

	// =========================================================
	// Phase 0: Setup - Verify seed data exists
	// =========================================================

	it('should have employees from seed data', async () => {
		const response = await request(app.getHttpServer()).get('/employees');

		expect(response.status).toBe(200);
		expect(response.body.length).toBeGreaterThanOrEqual(10);

		const seniors = response.body.filter((e: { role: string }) => e.role === 'SENIOR');
		const juniors = response.body.filter((e: { role: string }) => e.role === 'JUNIOR');
		expect(seniors.length).toBeGreaterThanOrEqual(5);
		expect(juniors.length).toBeGreaterThanOrEqual(5);

		employeeCount = response.body.length;
	});

	it('should have prize templates from seed data', async () => {
		const response = await request(app.getHttpServer()).get('/prizes');

		expect(response.status).toBe(200);
		expect(response.body.length).toBeGreaterThanOrEqual(5);

		response.body.forEach((p: { senior: number; junior: number }) => {
			expect(typeof p.senior).toBe('number');
			expect(typeof p.junior).toBe('number');
		});

		prizeCount = response.body.length;
	});

	// =========================================================
	// Phase 1: DRAFT - Create raffle (auto-associates employees and prizes)
	// =========================================================

	it('should create a new raffle in DRAFT status with auto-associated employees and prizes', async () => {
		// Create raffle - returns just { id }
		const createResponse = await request(app.getHttpServer())
			.post('/raffles')
			.send({ name: '2024 年末尾牙抽獎' });

		expect(createResponse.status).toBe(201);
		expect(createResponse.body.id).toBeDefined();
		raffleId = createResponse.body.id;

		// Get full detail
		const detailResponse = await request(app.getHttpServer())
			.get(`/raffles/${raffleId}`);

		expect(detailResponse.status).toBe(200);
		expect(detailResponse.body.name).toBe('2024 年末尾牙抽獎');
		expect(detailResponse.body.status).toBe('DRAFT');

		expect(detailResponse.body.participants.length).toBe(employeeCount);
		expect(detailResponse.body.prizes.length).toBe(prizeCount);
		expect(detailResponse.body.winners).toEqual([]);

		detailResponse.body.participants.forEach((p: { tags: string[] }) => {
			expect(p.tags).toEqual([]);
		});

		detailResponse.body.prizes.forEach((p: { isDrawn: boolean }) => {
			expect(p.isDrawn).toBe(false);
		});
	});

	// =========================================================
	// Phase 2: DRAFT → READY - Transition when ready
	// =========================================================

	it('should transition to READY status', async () => {
		const response = await request(app.getHttpServer())
			.patch(`/raffles/${raffleId}/status`)
			.send({ status: 'READY' });

		expect(response.status).toBe(204);

		// Verify status via GET
		const detailResponse = await request(app.getHttpServer())
			.get(`/raffles/${raffleId}`);

		expect(detailResponse.body.status).toBe('READY');
	});

	// =========================================================
	// Phase 3: READY → IN_PROGRESS - Draw first prize
	// =========================================================

	it('should draw first prize and transition to IN_PROGRESS', async () => {
		const response = await request(app.getHttpServer())
			.post(`/raffles/${raffleId}/draw`);

		expect(response.status).toBe(200);
		// DrawResultDto shape: winners[], prize, drawnAt
		expect(response.body.winners).toBeDefined();
		expect(Array.isArray(response.body.winners)).toBe(true);
		expect(response.body.winners.length).toBeGreaterThan(0);
		expect(response.body.prize).toBeDefined();
		expect(response.body.prize.rank).toBe('1-1');
		// Each winner should have drawnGroup
		expect(response.body.winners[0].drawnGroup).toBeDefined();

		// Verify status via GET
		const detailResponse = await request(app.getHttpServer())
			.get(`/raffles/${raffleId}`);

		expect(detailResponse.body.status).toBe('IN_PROGRESS');
	});

	// =========================================================
	// Phase 4: Continue drawing all remaining prizes
	// =========================================================

	it('should draw all remaining regular prizes until BONUS status', async () => {
		let currentStatus = 'IN_PROGRESS';
		let drawCount = 1; // Already drew rank 1-1

		while (currentStatus !== 'BONUS' && drawCount < prizeCount) {
			const response = await request(app.getHttpServer())
				.post(`/raffles/${raffleId}/draw`);

			expect(response.status).toBe(200);
			drawCount++;

			// Check status via GET
			const detailResponse = await request(app.getHttpServer())
				.get(`/raffles/${raffleId}`);

			currentStatus = detailResponse.body.status;
		}

		expect(currentStatus).toBe('BONUS');
	});

	// =========================================================
	// Phase 5: BONUS → COMPLETED - End the raffle
	// =========================================================

	it('should mark raffle as completed', async () => {
		const response = await request(app.getHttpServer())
			.patch(`/raffles/${raffleId}/status`)
			.send({ status: 'COMPLETED' });

		expect(response.status).toBe(204);

		// Verify status via GET
		const detailResponse = await request(app.getHttpServer())
			.get(`/raffles/${raffleId}`);

		expect(detailResponse.body.status).toBe('COMPLETED');
	});

	it('should reject any further operations on completed raffle', async () => {
		const bonusResponse = await request(app.getHttpServer())
			.post(`/raffles/${raffleId}/bonus-prizes`)
			.send({
				name: '額外獎',
				imageUrl: 'https://example.com/extra.jpg',
				total: 1,
			});

		expect(bonusResponse.status).toBe(400);

		const drawResponse = await request(app.getHttpServer())
			.post(`/raffles/${raffleId}/draw`);

		expect(drawResponse.status).toBe(400);
	});

	// =========================================================
	// Phase 6: Final verification
	// =========================================================

	it('should have correct final state', async () => {
		const response = await request(app.getHttpServer()).get(`/raffles/${raffleId}`);

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('COMPLETED');
		expect(response.body.participants.length).toBe(employeeCount);
		expect(response.body.prizes.length).toBe(prizeCount);

		response.body.prizes.forEach((p: { isDrawn: boolean }) => {
			expect(p.isDrawn).toBe(true);
		});

		expect(response.body.winners.length).toBeGreaterThan(0);

		const winnerParticipantIds = response.body.winners.map(
			(w: { participantId: number }) => w.participantId,
		);
		const uniqueWinnerIds = new Set(winnerParticipantIds);
		expect(uniqueWinnerIds.size).toBe(winnerParticipantIds.length);

		/* eslint-disable no-console */
		console.log('\n========================================');
		console.log('Raffle Lifecycle Complete!');
		console.log('========================================');
		console.log(`Raffle: ${response.body.name}`);
		console.log(`Status: ${response.body.status}`);
		console.log(`Participants: ${response.body.participants.length}`);
		console.log(`Prizes: ${response.body.prizes.length}`);
		console.log(`Winners: ${response.body.winners.length}`);
		console.log('========================================\n');
		/* eslint-enable no-console */
	});
});
