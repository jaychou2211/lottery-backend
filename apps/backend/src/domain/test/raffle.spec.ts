/**
 * Raffle Aggregate Root tests.
 *
 * @see {@link Raffle}
 */
import {
	InvalidStatusTransitionError,
	InsufficientEmployeesError,
	NoPrizeToDrawError,
	ParticipantAlreadyWonError,
	InvalidWinnerCountError,
	InvalidRaffleStatusError,
	EmptyParticipantsError,
	EligibilityPool,
} from '../raffle';
import {
	fakePrize,
	fakeBonusPrize,
	fakeRaffle,
	fakeEligibilityPool,
	fixedLottery,
	RegularEligibleCounts,
	BonusEligibleCounts,
	RaffleStatus,
	EmployeeRole,
	DrawnGroup,
	PrizeRank,
} from './factories';
import { NonConsecutiveSequenceError } from '../shared';

describe('Raffle', () => {
	describe('creation', () => {
		it('should default to DRAFT status and empty pendingEvents', () => {
			const raffle = fakeRaffle();

			expect(raffle.status).toBe(RaffleStatus.DRAFT);
			expect(raffle.pendingEvents).toHaveLength(0);
		});

		it('should accept provided status', () => {
			const raffle = fakeRaffle({ status: RaffleStatus.READY });

			expect(raffle.status).toBe(RaffleStatus.READY);
		});

		it('should validate prize ranks on creation', () => {
			const invalidPrizes = [
				fakePrize({ rank: PrizeRank.create(1, 1) }),
				fakePrize({ rank: PrizeRank.create(1, 3) }), // gap
			];

			expect(() => fakeRaffle({ prizes: invalidPrizes })).toThrow(NonConsecutiveSequenceError);
		});
	});

	describe('status transitions', () => {
		describe('manual transitions', () => {
			it('should allow DRAFT → READY', () => {
				const pool = fakeEligibilityPool([{ id: 1, role: EmployeeRole.SENIOR }]);
				const raffle = fakeRaffle({
					status: RaffleStatus.DRAFT,
					eligibilityPool: pool,
				});

				expect(raffle.transitionToReady().status).toBe(RaffleStatus.READY);
			});

			it('should allow BONUS → COMPLETED', () => {
				const raffle = fakeRaffle({ status: RaffleStatus.BONUS });

				expect(raffle.markAsCompleted().status).toBe(RaffleStatus.COMPLETED);
			});

			it('should throw InvalidStatusTransitionError when transitionToReady from non-DRAFT', () => {
				const pool = fakeEligibilityPool([{ id: 1, role: EmployeeRole.SENIOR }]);
				const raffle = fakeRaffle({
					status: RaffleStatus.READY,
					eligibilityPool: pool,
				});

				expect(() => raffle.transitionToReady()).toThrow(InvalidStatusTransitionError);
			});

			it('should throw InvalidStatusTransitionError when markAsCompleted from non-BONUS', () => {
				const raffle = fakeRaffle({ status: RaffleStatus.IN_PROGRESS });

				expect(() => raffle.markAsCompleted()).toThrow(InvalidStatusTransitionError);
			});
		});

		describe('automatic transitions', () => {
			it('should transition READY → IN_PROGRESS on first draw', () => {
				const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const pool = fakeEligibilityPool([
					{ id: 1, role: EmployeeRole.SENIOR },
					{ id: 2, role: EmployeeRole.JUNIOR },
				]);
				const raffle = fakeRaffle({
					prizes: [prize],
					status: RaffleStatus.READY,
					eligibilityPool: pool,
				});
				const lottery = fixedLottery([
					{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
				]);

				const result = raffle.draw('1-1', lottery);

				expect(result.status).toBe(RaffleStatus.IN_PROGRESS);
			});

			it('should transition IN_PROGRESS → BONUS when all regular prizes drawn', () => {
				const regularPrize1 = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const regularPrize2 = fakePrize({ rank: PrizeRank.create(1, 2), eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const bonusPrize = fakeBonusPrize({ rank: PrizeRank.create(6, 1), eligibleCounts: BonusEligibleCounts.create(1) });
				const pool = fakeEligibilityPool([
					{ id: 1, role: EmployeeRole.SENIOR },
					{ id: 2, role: EmployeeRole.JUNIOR },
					{ id: 3, role: EmployeeRole.SENIOR },
					{ id: 4, role: EmployeeRole.JUNIOR },
				]);
				const raffle = fakeRaffle({
					prizes: [regularPrize1, regularPrize2, bonusPrize],
					status: RaffleStatus.READY,
					eligibilityPool: pool,
				});

				const inProgress = raffle.draw('1-1', fixedLottery([
					{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
				]));
				expect(inProgress.status).toBe(RaffleStatus.IN_PROGRESS);

				const bonus = inProgress.draw('1-2', fixedLottery([
					{ participantId: 3, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 4, drawnGroup: DrawnGroup.JUNIOR },
				]));

				expect(bonus.status).toBe(RaffleStatus.BONUS);
			});

			it('should stay IN_PROGRESS when more regular prizes remain', () => {
				const prize1 = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const prize2 = fakePrize({ rank: PrizeRank.create(1, 2), eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const pool = fakeEligibilityPool([
					{ id: 1, role: EmployeeRole.SENIOR },
					{ id: 2, role: EmployeeRole.JUNIOR },
					{ id: 3, role: EmployeeRole.SENIOR },
					{ id: 4, role: EmployeeRole.JUNIOR },
				]);
				const raffle = fakeRaffle({
					prizes: [prize1, prize2],
					status: RaffleStatus.READY,
					eligibilityPool: pool,
				});
				const lottery = fixedLottery([
					{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
				]);

				const result = raffle.draw('1-1', lottery);

				expect(result.status).toBe(RaffleStatus.IN_PROGRESS);
			});
		});
	});

	describe('transitionToReady', () => {
		it('should transition to READY when participants are sufficient', () => {
			const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.SENIOR },
				{ id: 3, role: EmployeeRole.JUNIOR },
			]);
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.DRAFT,
				eligibilityPool: pool,
			});

			expect(raffle.transitionToReady().status).toBe(RaffleStatus.READY);
		});

		it('should throw EmptyParticipantsError when eligibilityPool is empty', () => {
			const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.DRAFT,
				eligibilityPool: fakeEligibilityPool([]),
			});

			expect(() => raffle.transitionToReady()).toThrow(EmptyParticipantsError);
		});

		it('should throw InsufficientEmployeesError when senior count is insufficient', () => {
			const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR }, // only 1 senior, need 2
				{ id: 2, role: EmployeeRole.JUNIOR },
			]);
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.DRAFT,
				eligibilityPool: pool,
			});

			expect(() => raffle.transitionToReady()).toThrow(InsufficientEmployeesError);
		});

		it('should throw InsufficientEmployeesError when junior count is insufficient', () => {
			const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.SENIOR },
				// no junior, need 1
			]);
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.DRAFT,
				eligibilityPool: pool,
			});

			expect(() => raffle.transitionToReady()).toThrow(InsufficientEmployeesError);
		});

		it('should aggregate counts across multiple prizes', () => {
			const prize1 = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const prize2 = fakePrize({ rank: PrizeRank.create(1, 2), eligibleCounts: RegularEligibleCounts.create(2, 1) });
			// Total need: 4 senior + 2 junior
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.SENIOR },
				{ id: 3, role: EmployeeRole.SENIOR }, // only 3 seniors, need 4
				{ id: 4, role: EmployeeRole.JUNIOR },
				{ id: 5, role: EmployeeRole.JUNIOR },
			]);
			const raffle = fakeRaffle({
				prizes: [prize1, prize2],
				status: RaffleStatus.DRAFT,
				eligibilityPool: pool,
			});

			expect(() => raffle.transitionToReady()).toThrow(InsufficientEmployeesError);
		});
	});

	describe('addBonusPrize', () => {
		it('should add prize in BONUS status with sufficient remaining participants', () => {
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.JUNIOR },
				{ id: 3, role: EmployeeRole.SENIOR },
			]);
			const raffle = fakeRaffle({
				status: RaffleStatus.BONUS,
				eligibilityPool: pool,
			});

			const result = raffle.addBonusPrize({
				name: 'Test Bonus',
				imageUrl: 'http://example.com/image.png',
				eligibleCounts: BonusEligibleCounts.create(3),
			});

			expect(result.prizes).toHaveLength(1);
			expect(result.prizes[0].eligibleCounts.total).toBe(3);
		});

		it('should auto-assign rank after existing prizes', () => {
			const existingPrizes = [
				fakePrize({ rank: PrizeRank.create(6, 1) }),
				fakePrize({ rank: PrizeRank.create(6, 2) }),
				fakePrize({ rank: PrizeRank.create(6, 3) }),
			];
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.JUNIOR },
			]);
			const raffle = fakeRaffle({
				status: RaffleStatus.BONUS,
				prizes: existingPrizes,
				eligibilityPool: pool,
			});

			const result = raffle.addBonusPrize({
				name: 'Test Bonus',
				imageUrl: 'http://example.com/image.png',
				eligibleCounts: BonusEligibleCounts.create(2),
			});

			expect(result.prizes[3].rank.level).toBe(6);
			expect(result.prizes[3].rank.sequence).toBe(4);
		});

		it('should throw InvalidRaffleStatusError when not in BONUS status', () => {
			const raffle = fakeRaffle({ status: RaffleStatus.IN_PROGRESS });

			expect(() =>
				raffle.addBonusPrize({
					name: 'Test',
					imageUrl: 'http://example.com/image.png',
					eligibleCounts: BonusEligibleCounts.create(3),
				}),
			).toThrow(InvalidRaffleStatusError);
		});

		it.each([
			{
				scenario: 'requested exceeds remaining',
				participantIds: [1, 2],
				wonIds: [] as number[],
				requestedTotal: 5,
			},
			{
				scenario: 'all participants already won',
				participantIds: [1, 2, 3],
				wonIds: [1, 2, 3],
				requestedTotal: 1,
			},
		])(
			'should throw InsufficientEmployeesError when $scenario',
			({ participantIds, wonIds, requestedTotal }) => {
				const pool = EligibilityPool.create(
					participantIds.map((id) => ({ id, role: EmployeeRole.SENIOR })),
					new Set(wonIds),
				);
				const raffle = fakeRaffle({
					status: RaffleStatus.BONUS,
					eligibilityPool: pool,
				});

				expect(() =>
					raffle.addBonusPrize({
						name: 'Test',
						imageUrl: 'http://example.com/image.png',
						eligibleCounts: BonusEligibleCounts.create(requestedTotal),
					}),
				).toThrow(InsufficientEmployeesError);
				expect(pool.remainingTotalCount).toBeLessThan(requestedTotal);
			},
		);
	});

	describe('draw', () => {
		describe('status validation', () => {
			it('should throw InvalidRaffleStatusError when status is DRAFT', () => {
				const currentStatus = RaffleStatus.DRAFT;
				const raffle = fakeRaffle({ status: currentStatus });

				expect(() => raffle.draw('1-1')).toThrow(InvalidRaffleStatusError);
			});

			it('should throw InvalidRaffleStatusError when status is COMPLETED', () => {
				const currentStatus = RaffleStatus.COMPLETED;
				const raffle = fakeRaffle({ status: currentStatus });

				expect(() => raffle.draw('1-1')).toThrow(InvalidRaffleStatusError);
			});
		});

		it('should throw NoPrizeToDrawError when no drawable prize', () => {
			const raffle = fakeRaffle({ prizes: [], status: RaffleStatus.READY });

			expect(() => raffle.draw('1-1')).toThrow(NoPrizeToDrawError);
		});

		it('should throw InvalidWinnerCountError for wrong counts', () => {
			const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.SENIOR },
				{ id: 3, role: EmployeeRole.JUNIOR },
			]);
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.READY,
				eligibilityPool: pool,
			});
			const wrongLottery = fixedLottery([
				{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
				{ participantId: 3, drawnGroup: DrawnGroup.JUNIOR },
			]);

			expect(() => raffle.draw('1-1', wrongLottery)).toThrow(InvalidWinnerCountError);
		});

		it('should create PrizeDrawnEvents with correct drawnGroup', () => {
			const prize = fakePrize({ id: 42, rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.JUNIOR },
			]);
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.READY,
				eligibilityPool: pool,
			});
			const lottery = fixedLottery([
				{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
				{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
			]);

			const result = raffle.draw('1-1', lottery);

			expect(result.pendingEvents.find((e) => e.participantId === 1)?.drawnGroup).toBe(DrawnGroup.SENIOR);
			expect(result.pendingEvents.find((e) => e.participantId === 2)?.drawnGroup).toBe(DrawnGroup.JUNIOR);
		});

		it('should mark prize as drawn and create pendingEvents', () => {
			const prize = fakePrize({ id: 42, rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.JUNIOR },
			]);
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.READY,
				eligibilityPool: pool,
			});
			const lottery = fixedLottery([
				{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
				{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
			]);

			const result = raffle.draw('1-1', lottery);

			expect(result.prizes[0].isDrawn).toBe(true);
			expect(result.pendingEvents).toHaveLength(2);
			expect(result.pendingEvents[0].prizeId).toBe(42);
		});

		it('should exclude already-won participants via eligibilityPool.hasWon', () => {
			const prize1 = fakePrize({ id: 1, rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const prize2 = fakePrize({ id: 2, rank: PrizeRank.create(1, 2), eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.SENIOR },
			]);
			const raffle = fakeRaffle({
				prizes: [prize1, prize2],
				status: RaffleStatus.READY,
				eligibilityPool: pool,
			});

			const afterFirst = raffle.draw('1-1', fixedLottery([{ participantId: 1, drawnGroup: DrawnGroup.SENIOR }]));

			expect(afterFirst.eligibilityPool.hasWon(1)).toBe(true);
			expect(afterFirst.eligibilityPool.hasWon(2)).toBe(false);
		});

		it('should throw ParticipantAlreadyWonError if lottery returns already-won participant', () => {
			const prize1 = fakePrize({ id: 1, rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const prize2 = fakePrize({ id: 2, rank: PrizeRank.create(1, 2), eligibleCounts: RegularEligibleCounts.create(1, 1) });
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.SENIOR },
				{ id: 3, role: EmployeeRole.JUNIOR },
			]);
			const raffle = fakeRaffle({
				prizes: [prize1, prize2],
				status: RaffleStatus.READY,
				eligibilityPool: pool,
			});

			const afterFirst = raffle.draw('1-1', fixedLottery([{ participantId: 1, drawnGroup: DrawnGroup.SENIOR }]));

			const faultyLottery = fixedLottery([
				{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
				{ participantId: 3, drawnGroup: DrawnGroup.JUNIOR },
			]);

			expect(() => afterFirst.draw('1-2', faultyLottery)).toThrow(ParticipantAlreadyWonError);
		});

		it('should accumulate pendingEvents across multiple draws', () => {
			const prize1 = fakePrize({ id: 1, rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const prize2 = fakePrize({ id: 2, rank: PrizeRank.create(1, 2), eligibleCounts: RegularEligibleCounts.create(0, 1) });
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.JUNIOR },
			]);
			const raffle = fakeRaffle({
				prizes: [prize1, prize2],
				status: RaffleStatus.READY,
				eligibilityPool: pool,
			});

			const afterFirst = raffle.draw('1-1', fixedLottery([{ participantId: 1, drawnGroup: DrawnGroup.SENIOR }]));
			const afterSecond = afterFirst.draw('1-2', fixedLottery([{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR }]));

			expect(afterSecond.pendingEvents).toHaveLength(2);
			expect(afterSecond.eligibilityPool.hasWon(1)).toBe(true);
			expect(afterSecond.eligibilityPool.hasWon(2)).toBe(true);
		});
	});

	describe('getPrizeByRank', () => {
		it('should return prize when rank exists', () => {
			const targetRank = PrizeRank.create(2, 1);
			const targetPrize = fakePrize({ rank: targetRank, name: 'Target Prize' });
			const raffle = fakeRaffle({
				prizes: [
					fakePrize({ rank: PrizeRank.create(1, 1) }),
					targetPrize,
					fakePrize({ rank: PrizeRank.create(3, 1) }),
				],
			});

			const found = raffle.getPrizeByRank(targetRank);

			expect(found?.name).toBe('Target Prize');
		});

		it('should return undefined when rank does not exist', () => {
			const existingRank = PrizeRank.create(1, 1);
			const nonExistentRank = PrizeRank.create(9, 9);
			const raffle = fakeRaffle({
				prizes: [fakePrize({ rank: existingRank })],
			});

			const found = raffle.getPrizeByRank(nonExistentRank);

			expect(found).toBeUndefined();
		});
	});

	describe('immutability', () => {
		it('should not modify original raffle after draw', () => {
			const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
			const pool = fakeEligibilityPool([
				{ id: 1, role: EmployeeRole.SENIOR },
				{ id: 2, role: EmployeeRole.JUNIOR },
			]);
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.READY,
				eligibilityPool: pool,
			});
			const lottery = fixedLottery([
				{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
				{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
			]);

			raffle.draw('1-1', lottery);

			expect(raffle.status).toBe(RaffleStatus.READY);
			expect(raffle.prizes[0].isDrawn).toBe(false);
			expect(raffle.pendingEvents).toHaveLength(0);
		});

		it('should not modify original raffle after addBonusPrize', () => {
			const pool = fakeEligibilityPool([{ id: 1, role: EmployeeRole.SENIOR }]);
			const raffle = fakeRaffle({
				status: RaffleStatus.BONUS,
				eligibilityPool: pool,
			});

			raffle.addBonusPrize({
				name: 'Test',
				imageUrl: 'http://example.com/image.png',
				eligibleCounts: BonusEligibleCounts.create(1),
			});

			expect(raffle.prizes).toHaveLength(0);
		});
	});
});
