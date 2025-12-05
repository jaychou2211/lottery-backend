import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { AppModule } from '../src/app.module';

/**
 * Raffle Lifecycle E2E Test
 *
 * Tests the complete raffle lifecycle:
 * DRAFT → READY → IN_PROGRESS → BONUS → COMPLETED
 *
 * Scenario:
 * - 年末尾牙抽獎活動
 * - Raffle automatically associates all active employees (10) and prize templates (8)
 * - 標記 2 人缺席（不影響抽獎資格，只影響領獎方式）
 */
describe('Raffle Lifecycle (e2e)', () => {
	let app: INestApplication;
	let raffleId: number;
	let employeeIds: number[];

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.useGlobalPipes(new ValidationPipe({
			transform: true,
			whitelist: true,
		}));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	// =========================================================
	// Phase 0: Setup - Verify seed data exists
	// =========================================================

	it('should have employees from seed data', async () => {
		const response = await request(app.getHttpServer()).get('/employees');

		expect(response.status).toBe(200);
		expect(response.body.length).toBeGreaterThanOrEqual(10);

		// Store employee IDs for later use
		employeeIds = response.body.slice(0, 10).map((e: { id: number }) => e.id);

		// Verify role distribution
		const seniors = response.body.filter((e: { role: string }) => e.role === 'SENIOR');
		const juniors = response.body.filter((e: { role: string }) => e.role === 'JUNIOR');
		expect(seniors.length).toBeGreaterThanOrEqual(5);
		expect(juniors.length).toBeGreaterThanOrEqual(5);
	});

	it('should have prize templates from seed data', async () => {
		const response = await request(app.getHttpServer()).get('/prizes');

		expect(response.status).toBe(200);
		expect(response.body.length).toBeGreaterThanOrEqual(5);

		// Verify senior/junior configuration exists
		response.body.forEach((p: { senior: number; junior: number }) => {
			expect(typeof p.senior).toBe('number');
			expect(typeof p.junior).toBe('number');
		});
	});

	// =========================================================
	// Phase 1: DRAFT - Create raffle (auto-associates employees and prizes)
	// =========================================================

	it('should create a new raffle in DRAFT status with auto-associated employees and prizes', async () => {
		const response = await request(app.getHttpServer())
			.post('/raffles')
			.send({ name: '2024 年末尾牙抽獎' });

		expect(response.status).toBe(201);
		expect(response.body.name).toBe('2024 年末尾牙抽獎');
		expect(response.body.status).toBe('DRAFT');

		// Should auto-associate all active employees as participants
		expect(response.body.participants.length).toBe(10);

		// Should auto-associate all active prize templates as prizes
		expect(response.body.prizes.length).toBe(5);

		// Winners should be empty initially
		expect(response.body.winners).toEqual([]);

		// All participants should be marked as attended by default
		response.body.participants.forEach((p: { attended: boolean }) => {
			expect(p.attended).toBe(true);
		});

		// Prizes should have correct ranks (1-5)
		response.body.prizes.forEach((p: { rank: number; isDrawn: boolean }, index: number) => {
			expect(p.rank).toBe(index + 1);
			expect(p.isDrawn).toBe(false);
		});

		raffleId = response.body.id;
	});

	it('should mark some participants as absent', async () => {
		// Mark 2 participants (index 0 and 5) as absent
		// This doesn't affect lottery eligibility, only prize collection method
		const response = await request(app.getHttpServer())
			.patch(`/raffles/${raffleId}/attendance`)
			.send({
				records: [
					{ employeeId: employeeIds[0], attended: false },
					{ employeeId: employeeIds[5], attended: false },
				],
			});

		expect(response.status).toBe(200);

		const absentees = response.body.participants.filter((p: { attended: boolean }) => !p.attended);
		expect(absentees.length).toBe(2);
	});

	// =========================================================
	// Phase 2: DRAFT → READY - Transition when ready
	// =========================================================

	it('should transition to READY status', async () => {
		const response = await request(app.getHttpServer())
			.patch(`/raffles/${raffleId}/status`)
			.send({ status: 'READY' });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('READY');
	});

	// =========================================================
	// Phase 3: READY → IN_PROGRESS - Draw prizes sequentially
	// =========================================================

	it('should draw rank 1 prize (特獎) and transition to IN_PROGRESS', async () => {
		const response = await request(app.getHttpServer())
			.post(`/raffles/${raffleId}/draw`)
			.send({ rank: 1 });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('IN_PROGRESS');

		// Prize 1 (特獎) should be marked as drawn
		const prize1 = response.body.prizes.find((p: { rank: number }) => p.rank === 1);
		expect(prize1.isDrawn).toBe(true);

		// Should have 2 winners (senior: 1, junior: 1)
		const prize1Winners = response.body.winners.filter(
			(w: { rafflePrizeId: number }) => w.rafflePrizeId === prize1.id,
		);
		expect(prize1Winners.length).toBe(2);

		// Verify drawn groups
		const seniorWinners = prize1Winners.filter((w: { drawnGroup: string }) => w.drawnGroup === 'SENIOR');
		const juniorWinners = prize1Winners.filter((w: { drawnGroup: string }) => w.drawnGroup === 'JUNIOR');
		expect(seniorWinners.length).toBe(1);
		expect(juniorWinners.length).toBe(1);
	});

	it('should reject drawing out of order', async () => {
		// Try to draw rank 3 when rank 2 hasn't been drawn
		const response = await request(app.getHttpServer())
			.post(`/raffles/${raffleId}/draw`)
			.send({ rank: 3 });

		expect(response.status).toBe(400);
	});

	it('should draw rank 2 prize (頭獎)', async () => {
		const response = await request(app.getHttpServer())
			.post(`/raffles/${raffleId}/draw`)
			.send({ rank: 2 });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('IN_PROGRESS');

		// Prize 2 (頭獎) should be marked as drawn
		const prize2 = response.body.prizes.find((p: { rank: number }) => p.rank === 2);
		expect(prize2.isDrawn).toBe(true);

		// Should have 2 winners (senior: 1, junior: 1)
		const prize2Winners = response.body.winners.filter(
			(w: { rafflePrizeId: number }) => w.rafflePrizeId === prize2.id,
		);
		expect(prize2Winners.length).toBe(2);

		// Total winners now: 2 + 2 = 4
		expect(response.body.winners.length).toBe(4);
	});

	// =========================================================
	// Phase 4: Continue drawing remaining prizes
	// =========================================================

	it('should draw remaining regular prizes (rank 3-5)', async () => {
		let totalWinners = 4; // Already have 4 winners from previous draws (2 + 2)

		// Draw prizes 3 through 5
		for (let rank = 3; rank <= 5; rank++) {
			const response = await request(app.getHttpServer())
				.post(`/raffles/${raffleId}/draw`)
				.send({ rank });

			expect(response.status).toBe(200);

			const drawnPrize = response.body.prizes.find((p: { rank: number }) => p.rank === rank);
			expect(drawnPrize.isDrawn).toBe(true);

			// Winners should increase
			expect(response.body.winners.length).toBeGreaterThan(totalWinners);
			totalWinners = response.body.winners.length;

			// After rank 5 (last regular prize), should be in BONUS status
			if (rank === 5) {
				expect(response.body.status).toBe('BONUS');
			} else {
				expect(response.body.status).toBe('IN_PROGRESS');
			}
		}

		// Final winner count after all regular prizes: 5 prizes × 2 winners each = 10
		expect(totalWinners).toBe(10);
	});

	// =========================================================
	// Phase 5: BONUS - Verify no remaining participants for bonus
	// =========================================================

	// Note: With 5 prizes × 2 winners = 10 winners, all participants have won.
	// In a real scenario, you might have more participants or fewer prize winners.
	// This test verifies the BONUS status is reached after all regular prizes are drawn.

	// =========================================================
	// Phase 6: BONUS → COMPLETED - End the raffle
	// =========================================================

	it('should mark raffle as completed', async () => {
		const response = await request(app.getHttpServer())
			.patch(`/raffles/${raffleId}/status`)
			.send({ status: 'COMPLETED' });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('COMPLETED');
	});

	it('should reject any further operations on completed raffle', async () => {
		// Try to add more bonus prizes
		const bonusResponse = await request(app.getHttpServer())
			.post(`/raffles/${raffleId}/bonus-prizes`)
			.send({
				name: '額外獎',
				prizeLevel: '額外獎',
				imageUrl: 'https://example.com/extra.jpg',
				total: 1,
			});

		expect(bonusResponse.status).toBe(400);

		// Try to draw
		const drawResponse = await request(app.getHttpServer())
			.post(`/raffles/${raffleId}/draw`)
			.send({ rank: 99 });

		expect(drawResponse.status).toBe(400);
	});

	// =========================================================
	// Phase 7: Final verification
	// =========================================================

	it('should have correct final state', async () => {
		const response = await request(app.getHttpServer()).get(`/raffles/${raffleId}`);

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('COMPLETED');
		expect(response.body.participants.length).toBe(10);
		expect(response.body.prizes.length).toBe(5); // 5 regular prizes

		// All prizes should be drawn
		response.body.prizes.forEach((p: { isDrawn: boolean }) => {
			expect(p.isDrawn).toBe(true);
		});

		// All 10 participants should have won (5 prizes × 2 winners each)
		expect(response.body.winners.length).toBe(10);

		// Each winner should have unique participant
		const winnerParticipantIds = response.body.winners.map(
			(w: { participantId: number }) => w.participantId,
		);
		const uniqueWinnerIds = new Set(winnerParticipantIds);
		expect(uniqueWinnerIds.size).toBe(winnerParticipantIds.length);

		/* eslint-disable no-console */
		console.log('\n========================================');
		console.log('🎉 Raffle Lifecycle Complete!');
		console.log('========================================');
		console.log(`Raffle: ${response.body.name}`);
		console.log(`Status: ${response.body.status}`);
		console.log(`Participants: ${response.body.participants.length}`);
		console.log(`Prizes: ${response.body.prizes.length}`);
		console.log(`Winners: ${response.body.winners.length}`);
		console.log('----------------------------------------');
		response.body.prizes.forEach((prize: { name: string; eligibleCounts: { kind: string; total?: number; senior?: number; junior?: number } }) => {
			const count = prize.eligibleCounts.kind === 'bonus'
				? prize.eligibleCounts.total
				: (prize.eligibleCounts.senior ?? 0) + (prize.eligibleCounts.junior ?? 0);
			console.log(`  ${prize.name} (${prize.eligibleCounts.kind}): ${count} winners`);
		});
		console.log('========================================\n');
		/* eslint-enable no-console */
	});
});
