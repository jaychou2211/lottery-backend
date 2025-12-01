/**
 * Raffle Aggregate Root tests.
 *
 * @see {@link Raffle}
 */
import {
	InvalidStatusTransitionError,
	InsufficientEmployeesError,
	InvalidDrawOrderError,
	AlreadyDrawnError,
	PrizeNotFoundError,
	ParticipantAlreadyWonError,
	InvalidWinnerCountError,
	PrizeTypeMismatchError,
	InvalidRaffleStatusError,
	DuplicateParticipantError,
	ParticipantNotFoundError,
	EmptyParticipantsError,
} from '../raffle';
import type { LotteryStrategy, RaffleParticipant } from '../raffle';
import {
	fakeEmployee,
	fakeParticipant,
	fakePrize,
	fakeBonusPrize,
	fakeRaffle,
	fixedLottery,
	RegularEligibleCounts,
	BonusEligibleCounts,
	RaffleStatus,
	EmployeeRole,
	DrawnGroup,
} from './factories';

describe('Raffle', () => {
	describe('creation', () => {
		it('should default to DRAFT status and empty winners', () => {
			const raffle = fakeRaffle();

			expect(raffle.status).toBe(RaffleStatus.DRAFT);
			expect(raffle.winners).toHaveLength(0);
		});

		it('should accept provided status', () => {
			const raffle = fakeRaffle({ status: RaffleStatus.READY });

			expect(raffle.status).toBe(RaffleStatus.READY);
		});
	});

	describe('status transitions', () => {
		describe('manual transitions', () => {
			it('should allow DRAFT → READY', () => {
				const raffle = fakeRaffle({
					status: RaffleStatus.DRAFT,
					participants: [fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR })],
				});

				expect(raffle.transitionToReady().status).toBe(RaffleStatus.READY);
			});

			it('should allow BONUS → COMPLETED', () => {
				const raffle = fakeRaffle({ status: RaffleStatus.BONUS });

				expect(raffle.markAsCompleted().status).toBe(RaffleStatus.COMPLETED);
			});

			it('should throw InvalidStatusTransitionError when transitionToReady from non-DRAFT', () => {
				const raffle = fakeRaffle({
					status: RaffleStatus.READY,
					participants: [fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR })],
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
				const prize = fakePrize({ rank: 1, eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const raffle = fakeRaffle({
					prizes: [prize],
					status: RaffleStatus.READY,
					participants: [
						fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
						fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
					],
				});
				const lottery = fixedLottery([
					{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
				]);

				const result = raffle.draw(1, lottery);

				expect(result.status).toBe(RaffleStatus.IN_PROGRESS);
			});

			it('should transition IN_PROGRESS → BONUS when all regular prizes drawn', () => {
				const regularPrize1 = fakePrize({ rank: 1, eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const regularPrize2 = fakePrize({ rank: 2, eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const bonusPrize = fakeBonusPrize({ rank: 3, eligibleCounts: BonusEligibleCounts.create(1) });
				const raffle = fakeRaffle({
					prizes: [regularPrize1, regularPrize2, bonusPrize],
					status: RaffleStatus.READY,
					participants: [
						fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
						fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
						fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.SENIOR }),
						fakeParticipant({ id: 4, employeeId: 400, role: EmployeeRole.JUNIOR }),
					],
				});

				// First draw: READY → IN_PROGRESS
				const inProgress = raffle.draw(1, fixedLottery([
					{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
				]));
				expect(inProgress.status).toBe(RaffleStatus.IN_PROGRESS);

				// Second draw: IN_PROGRESS → BONUS (all regular prizes drawn)
				const bonus = inProgress.draw(2, fixedLottery([
					{ participantId: 3, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 4, drawnGroup: DrawnGroup.JUNIOR },
				]));

				expect(bonus.status).toBe(RaffleStatus.BONUS);
			});

			it('should stay IN_PROGRESS when more regular prizes remain', () => {
				const prize1 = fakePrize({ rank: 1, eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const prize2 = fakePrize({ rank: 2, eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const raffle = fakeRaffle({
					prizes: [prize1, prize2],
					status: RaffleStatus.READY,
					participants: [
						fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
						fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
						fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.SENIOR }),
						fakeParticipant({ id: 4, employeeId: 400, role: EmployeeRole.JUNIOR }),
					],
				});
				const lottery = fixedLottery([
					{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
				]);

				const result = raffle.draw(1, lottery);

				expect(result.status).toBe(RaffleStatus.IN_PROGRESS);
			});
		});
	});

	describe('transitionToReady (using participants)', () => {
		it('should transition to READY when participants are sufficient', () => {
			const prize = fakePrize({ rank: 1, eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.DRAFT,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.JUNIOR }),
				],
			});

			expect(raffle.transitionToReady().status).toBe(RaffleStatus.READY);
		});

		it('should throw EmptyParticipantsError when participants is empty', () => {
			const prize = fakePrize({ rank: 1, eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const raffle = fakeRaffle({ prizes: [prize], status: RaffleStatus.DRAFT });

			expect(() => raffle.transitionToReady()).toThrow(EmptyParticipantsError);
		});

		it('should throw InsufficientEmployeesError when senior count is insufficient', () => {
			const prize = fakePrize({ rank: 1, eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.DRAFT,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }), // only 1 senior, need 2
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
				],
			});

			expect(() => raffle.transitionToReady()).toThrow(InsufficientEmployeesError);
		});

		it('should throw InsufficientEmployeesError when junior count is insufficient', () => {
			const prize = fakePrize({ rank: 1, eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.DRAFT,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.SENIOR }),
					// no junior, need 1
				],
			});

			expect(() => raffle.transitionToReady()).toThrow(InsufficientEmployeesError);
		});

		it('should aggregate counts across multiple prizes', () => {
			const prize1 = fakePrize({ rank: 1, eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const prize2 = fakePrize({ rank: 2, eligibleCounts: RegularEligibleCounts.create(2, 1) });
			// Total need: 4 senior + 2 junior
			const raffle = fakeRaffle({
				prizes: [prize1, prize2],
				status: RaffleStatus.DRAFT,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.SENIOR }), // only 3 seniors, need 4
					fakeParticipant({ id: 4, employeeId: 400, role: EmployeeRole.JUNIOR }),
					fakeParticipant({ id: 5, employeeId: 500, role: EmployeeRole.JUNIOR }),
				],
			});

			expect(() => raffle.transitionToReady()).toThrow(InsufficientEmployeesError);
		});
	});

	describe('addBonusPrize', () => {
		it('should add prize in BONUS status with sufficient remaining participants', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.BONUS,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
					fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.SENIOR }),
				],
			});
			const bonusPrize = fakeBonusPrize({ rank: 99, eligibleCounts: BonusEligibleCounts.create(3) });

			const result = raffle.addBonusPrize(bonusPrize);

			expect(result.prizes).toHaveLength(1);
			expect(result.prizes[0].eligibleCounts).toBe(bonusPrize.eligibleCounts);
		});

		it('should auto-assign rank after existing prizes', () => {
			const existingPrize = fakePrize({ rank: 5 });
			const raffle = fakeRaffle({
				status: RaffleStatus.BONUS,
				prizes: [existingPrize],
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
				],
			});
			const bonusPrize = fakeBonusPrize({ rank: 1, eligibleCounts: BonusEligibleCounts.create(2) });

			const result = raffle.addBonusPrize(bonusPrize);

			expect(result.prizes[1].rank).toBe(6); // auto-assigned after max rank
		});

		it('should auto-assign sequential ranks for multiple bonus prizes', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.BONUS,
				prizes: [fakePrize({ rank: 3 })],
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
					fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.SENIOR }),
				],
			});

			const result1 = raffle.addBonusPrize(fakeBonusPrize({ eligibleCounts: BonusEligibleCounts.create(1) }));
			const result2 = result1.addBonusPrize(fakeBonusPrize({ eligibleCounts: BonusEligibleCounts.create(1) }));

			expect(result1.prizes[1].rank).toBe(4);
			expect(result2.prizes[2].rank).toBe(5);
		});

		it('should throw InvalidRaffleStatusError when not in BONUS status', () => {
			const raffle = fakeRaffle({ status: RaffleStatus.IN_PROGRESS });
			const bonusPrize = fakeBonusPrize({ rank: 1, eligibleCounts: BonusEligibleCounts.create(3) });

			expect(() => raffle.addBonusPrize(bonusPrize)).toThrow(InvalidRaffleStatusError);
		});

		// Note: InvalidBonusPrizeError is now prevented at compile-time via PersistedBonusPrize type

		it('should throw InsufficientEmployeesError when remaining participants insufficient', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.BONUS,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
				],
			});
			const bonusPrize = fakeBonusPrize({ rank: 1, eligibleCounts: BonusEligibleCounts.create(5) });

			expect(() => raffle.addBonusPrize(bonusPrize)).toThrow(InsufficientEmployeesError);
		});
	});

	describe('draw', () => {
		describe('sequential ordering', () => {
			it('should allow drawing next undrawn prize in rank order', () => {
				const prizes = [
					fakePrize({ rank: 1, isDrawn: true }),
					fakePrize({ rank: 2, isDrawn: false }),
				];
				const raffle = fakeRaffle({ prizes, status: RaffleStatus.IN_PROGRESS });

				expect(() => raffle.assertCanDraw(2)).not.toThrow();
			});

			it('should throw InvalidDrawOrderError when skipping', () => {
				const prizes = [
					fakePrize({ rank: 1, isDrawn: false }),
					fakePrize({ rank: 2, isDrawn: false }),
				];
				const raffle = fakeRaffle({ prizes, status: RaffleStatus.IN_PROGRESS });

				expect(() => raffle.assertCanDraw(2)).toThrow(InvalidDrawOrderError);
			});

			it('should throw AlreadyDrawnError for drawn prize', () => {
				const prizes = [fakePrize({ rank: 1, isDrawn: true })];
				const raffle = fakeRaffle({ prizes, status: RaffleStatus.IN_PROGRESS });

				expect(() => raffle.assertCanDraw(1)).toThrow(AlreadyDrawnError);
			});

			it('should throw PrizeNotFoundError for non-existent rank', () => {
				const raffle = fakeRaffle({ prizes: [fakePrize({ rank: 1 })], status: RaffleStatus.READY });

				expect(() => raffle.assertCanDraw(999)).toThrow(PrizeNotFoundError);
			});

			it('should only consider bonus prizes for ordering in BONUS status', () => {
				const prizes = [
					fakePrize({ rank: 1, isDrawn: false }), // regular, undrawn
					fakeBonusPrize({ rank: 2, eligibleCounts: BonusEligibleCounts.create(3), isDrawn: false }),
					fakeBonusPrize({ rank: 3, eligibleCounts: BonusEligibleCounts.create(2), isDrawn: false }),
				];
				const raffle = fakeRaffle({ prizes, status: RaffleStatus.BONUS });

				expect(() => raffle.assertCanDraw(2)).not.toThrow();
				expect(() => raffle.assertCanDraw(3)).toThrow(InvalidDrawOrderError);
			});
		});

		describe('grouped drawing', () => {
			it.each([RaffleStatus.READY, RaffleStatus.IN_PROGRESS])(
				'should allow regular prize in %s status',
				(status) => {
					const raffle = fakeRaffle({ prizes: [fakePrize({ rank: 1 })], status });

					expect(() => raffle.assertCanDraw(1)).not.toThrow();
				},
			);

			it.each([RaffleStatus.DRAFT, RaffleStatus.BONUS, RaffleStatus.COMPLETED])(
				'should throw PrizeTypeMismatchError for regular prize in %s status',
				(status) => {
					const raffle = fakeRaffle({ prizes: [fakePrize({ rank: 1 })], status });

					expect(() => raffle.assertCanDraw(1)).toThrow(PrizeTypeMismatchError);
				},
			);

			it('should allow bonus prize only in BONUS status', () => {
				const bonusPrize = fakeBonusPrize({ rank: 1, eligibleCounts: BonusEligibleCounts.create(5) });

				expect(() => fakeRaffle({ prizes: [bonusPrize], status: RaffleStatus.BONUS }).assertCanDraw(1)).not.toThrow();
				expect(() => fakeRaffle({ prizes: [bonusPrize], status: RaffleStatus.IN_PROGRESS }).assertCanDraw(1)).toThrow(PrizeTypeMismatchError);
			});

			it('should throw InvalidWinnerCountError for wrong counts', () => {
				const prize = fakePrize({ rank: 1, eligibleCounts: RegularEligibleCounts.create(2, 1) });
				const raffle = fakeRaffle({
					prizes: [prize],
					status: RaffleStatus.READY,
					participants: [
						fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
						fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.SENIOR }),
						fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.JUNIOR }),
					],
				});
				// Wrong counts: expects 2 senior + 1 junior, lottery returns 1 senior + 1 junior
				const wrongLottery = fixedLottery([
					{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 3, drawnGroup: DrawnGroup.JUNIOR },
				]);

				expect(() => raffle.draw(1, wrongLottery)).toThrow(InvalidWinnerCountError);
			});

			it('should record correct drawnGroup for winners', () => {
				const prize = fakePrize({ id: 42, rank: 1, eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const raffle = fakeRaffle({
					prizes: [prize],
					status: RaffleStatus.READY,
					participants: [
						fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
						fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
					],
				});
				const lottery = fixedLottery([
					{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
				]);

				const result = raffle.draw(1, lottery);

				expect(result.winners.find((w) => w.participantId === 1)?.drawnGroup).toBe(DrawnGroup.SENIOR);
				expect(result.winners.find((w) => w.participantId === 2)?.drawnGroup).toBe(DrawnGroup.JUNIOR);
			});
		});

		describe('result recording', () => {
			it('should mark prize as drawn and create winners with correct fields', () => {
				const prize = fakePrize({ id: 42, rank: 1, eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const raffle = fakeRaffle({
					prizes: [prize],
					status: RaffleStatus.READY,
					participants: [
						fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
						fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
					],
				});
				const lottery = fixedLottery([
					{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
				]);

				const result = raffle.draw(1, lottery);

				expect(result.prizes[0].isDrawn).toBe(true);
				expect(result.winners).toHaveLength(2);
				expect(result.winners[0].rafflePrizeId).toBe(42);
				expect(result.winners[0].id).toBeNull(); // new record
			});
		});
	});

	describe('draw (using participants)', () => {
		it('should draw from participants', () => {
			const prize = fakePrize({ id: 1, rank: 1, eligibleCounts: RegularEligibleCounts.create(1, 1) });
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.READY,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
				],
			});
			const lottery = fixedLottery([
				{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
				{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
			]);

			const result = raffle.draw(1, lottery);

			expect(result.winners).toHaveLength(2);
			expect(result.winners[0].participantId).toBe(1);
			expect(result.winners[1].participantId).toBe(2);
		});

		it('should exclude already-won participants from candidates', () => {
			const prize1 = fakePrize({ id: 1, rank: 1, eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const prize2 = fakePrize({ id: 2, rank: 2, eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const raffle = fakeRaffle({
				prizes: [prize1, prize2],
				status: RaffleStatus.READY,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.SENIOR }),
				],
			});

			// First draw - participant 1 wins
			const afterFirst = raffle.draw(1, fixedLottery([{ participantId: 1, drawnGroup: DrawnGroup.SENIOR }]));

			// Second draw - only participant 2 should be in pool
			let receivedCandidates: readonly RaffleParticipant[] = [];
			const spyLottery: LotteryStrategy = (cands) => {
				receivedCandidates = cands;
				return [{ participantId: 2, drawnGroup: DrawnGroup.SENIOR }];
			};

			afterFirst.draw(2, spyLottery);

			expect(receivedCandidates).toHaveLength(1);
			expect(receivedCandidates[0].id).toBe(2);
		});

		it('should throw ParticipantAlreadyWonError if lottery returns already-won participant', () => {
			const prize1 = fakePrize({ id: 1, rank: 1, eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const prize2 = fakePrize({ id: 2, rank: 2, eligibleCounts: RegularEligibleCounts.create(1, 1) });
			const raffle = fakeRaffle({
				prizes: [prize1, prize2],
				status: RaffleStatus.READY,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.JUNIOR }),
				],
			});

			// First draw - participant 1 wins
			const afterFirst = raffle.draw(1, fixedLottery([{ participantId: 1, drawnGroup: DrawnGroup.SENIOR }]));

			// Second draw - faulty lottery tries to return already-won participant
			const faultyLottery = fixedLottery([
				{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
				{ participantId: 3, drawnGroup: DrawnGroup.JUNIOR },
			]);

			expect(() => afterFirst.draw(2, faultyLottery)).toThrow(ParticipantAlreadyWonError);
		});

		it('should accumulate winners across multiple draws', () => {
			const prize1 = fakePrize({ id: 1, rank: 1, eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const prize2 = fakePrize({ id: 2, rank: 2, eligibleCounts: RegularEligibleCounts.create(0, 1) });
			const raffle = fakeRaffle({
				prizes: [prize1, prize2],
				status: RaffleStatus.READY,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
				],
			});

			const afterFirst = raffle.draw(1, fixedLottery([{ participantId: 1, drawnGroup: DrawnGroup.SENIOR }]));
			const afterSecond = afterFirst.draw(2, fixedLottery([{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR }]));

			expect(afterSecond.winners).toHaveLength(2);
			expect(afterSecond.hasParticipantWon(1)).toBe(true);
			expect(afterSecond.hasParticipantWon(2)).toBe(true);
		});

		it('should allow attended=false participants to be drawn', () => {
			const prize = fakePrize({ id: 1, rank: 1, eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const participant = fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }).withAttended(false);
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.READY,
				participants: [participant],
			});
			const lottery = fixedLottery([{ participantId: 1, drawnGroup: DrawnGroup.SENIOR }]);

			const result = raffle.draw(1, lottery);

			expect(result.winners).toHaveLength(1);
			expect(result.winners[0].participantId).toBe(1);
		});
	});

	describe('immutability', () => {
		it('should not modify original raffle after draw', () => {
			const prize = fakePrize({ rank: 1, eligibleCounts: RegularEligibleCounts.create(1, 1) });
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.READY,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
				],
			});
			const lottery = fixedLottery([
				{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
				{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
			]);

			raffle.draw(1, lottery);

			expect(raffle.status).toBe(RaffleStatus.READY);
			expect(raffle.prizes[0].isDrawn).toBe(false);
			expect(raffle.winners).toHaveLength(0);
		});

		it('should not modify original raffle after addBonusPrize', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.BONUS,
				participants: [fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR })],
			});
			const bonusPrize = fakeBonusPrize({ rank: 1, eligibleCounts: BonusEligibleCounts.create(1) });

			raffle.addBonusPrize(bonusPrize);

			expect(raffle.prizes).toHaveLength(0);
		});
	});

	describe('addParticipants', () => {
		it('should add multiple participants in DRAFT status', () => {
			const raffle = fakeRaffle({ status: RaffleStatus.DRAFT });
			const employees = [
				fakeEmployee({ id: 1, staffNumber: 'EMP001', name: 'Alice', role: EmployeeRole.SENIOR }),
				fakeEmployee({ id: 2, staffNumber: 'EMP002', name: 'Bob', role: EmployeeRole.JUNIOR }),
			];

			const result = raffle.addParticipants(employees);

			expect(result.participants).toHaveLength(2);
		});

		it('should create correct snapshot fields with null id', () => {
			const raffle = fakeRaffle({ status: RaffleStatus.DRAFT });
			const employee = fakeEmployee({
				id: 100,
				staffNumber: 'EMP100',
				name: 'John Doe',
				department: 'Engineering',
				role: EmployeeRole.SENIOR,
			});

			const result = raffle.addParticipants([employee]);

			const participant = result.participants[0];
			expect(participant.id).toBeNull();
			expect(participant.employeeId).toBe(100);
			expect(participant.staffNumber).toBe('EMP100');
			expect(participant.name).toBe('John Doe');
			expect(participant.department).toBe('Engineering');
			expect(participant.role).toBe(EmployeeRole.SENIOR);
			expect(participant.attended).toBe(true);
		});

		it('should not change participants when given empty array', () => {
			const raffle = fakeRaffle({ status: RaffleStatus.DRAFT });

			const result = raffle.addParticipants([]);

			expect(result.participants).toHaveLength(0);
		});

		it('should throw InvalidRaffleStatusError when not in DRAFT', () => {
			const raffle = fakeRaffle({ status: RaffleStatus.READY });
			const employees = [fakeEmployee({ id: 1 })];

			expect(() => raffle.addParticipants(employees)).toThrow(InvalidRaffleStatusError);
		});

		it('should throw DuplicateParticipantError when input has duplicate employeeId', () => {
			const raffle = fakeRaffle({ status: RaffleStatus.DRAFT });
			const employees = [
				fakeEmployee({ id: 1 }),
				fakeEmployee({ id: 1 }), // duplicate
			];

			expect(() => raffle.addParticipants(employees)).toThrow(DuplicateParticipantError);
		});

		it('should throw DuplicateParticipantError when employeeId already exists in participants', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.DRAFT,
				participants: [fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR })],
			});

			const newEmployee = fakeEmployee({ id: 100 }); // same employeeId

			expect(() => raffle.addParticipants([newEmployee])).toThrow(DuplicateParticipantError);
		});

		it('should not modify original raffle', () => {
			const raffle = fakeRaffle({ status: RaffleStatus.DRAFT });
			const employees = [fakeEmployee({ id: 1 })];

			raffle.addParticipants(employees);

			expect(raffle.participants).toHaveLength(0);
		});
	});

	describe('markAttendance', () => {
		it('should mark single participant attendance in DRAFT status', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.DRAFT,
				participants: [fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR })],
			});

			const result = raffle.markAttendance([{ employeeId: 100, attended: false }]);

			expect(result.participants[0].attended).toBe(false);
		});

		it('should mark single participant attendance in READY status', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.READY,
				participants: [fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR })],
			});

			const result = raffle.markAttendance([{ employeeId: 100, attended: false }]);

			expect(result.participants[0].attended).toBe(false);
		});

		it('should mark multiple participants attendance', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.DRAFT,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
					fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.SENIOR }),
				],
			});

			const result = raffle.markAttendance([
				{ employeeId: 100, attended: false },
				{ employeeId: 300, attended: false },
			]);

			expect(result.participants.find((p) => p.employeeId === 100)?.attended).toBe(false);
			expect(result.participants.find((p) => p.employeeId === 200)?.attended).toBe(true);
			expect(result.participants.find((p) => p.employeeId === 300)?.attended).toBe(false);
		});

		it('should throw InvalidRaffleStatusError when in IN_PROGRESS status', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.IN_PROGRESS,
				participants: [fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR })],
			});

			expect(() => raffle.markAttendance([{ employeeId: 100, attended: false }]))
				.toThrow(InvalidRaffleStatusError);
		});

		it('should throw InvalidRaffleStatusError when in BONUS status', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.BONUS,
				participants: [fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR })],
			});

			expect(() => raffle.markAttendance([{ employeeId: 100, attended: false }]))
				.toThrow(InvalidRaffleStatusError);
		});

		it('should throw ParticipantNotFoundError when employeeId not found', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.DRAFT,
				participants: [fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR })],
			});

			expect(() => raffle.markAttendance([{ employeeId: 999, attended: false }]))
				.toThrow(ParticipantNotFoundError);
		});

		it('should not modify original raffle', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.DRAFT,
				participants: [fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR })],
			});

			raffle.markAttendance([{ employeeId: 100, attended: false }]);

			expect(raffle.participants[0].attended).toBe(true);
		});
	});
});
