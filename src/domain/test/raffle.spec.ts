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
	DuplicateParticipantError,
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
	PrizeRank,
} from './factories';
import { NonConsecutiveSequenceError } from '../shared';

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

		// Prize rank validation details are tested in prize-rank.spec.ts
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
				const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
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

				const result = raffle.draw(lottery);

				expect(result.status).toBe(RaffleStatus.IN_PROGRESS);
			});

			it('should transition IN_PROGRESS → BONUS when all regular prizes drawn', () => {
				const regularPrize1 = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const regularPrize2 = fakePrize({ rank: PrizeRank.create(1, 2), eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const bonusPrize = fakeBonusPrize({ rank: PrizeRank.create(5, 1), eligibleCounts: BonusEligibleCounts.create(1) });
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

				const inProgress = raffle.draw(fixedLottery([
					{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR },
				]));
				expect(inProgress.status).toBe(RaffleStatus.IN_PROGRESS);

				const bonus = inProgress.draw(fixedLottery([
					{ participantId: 3, drawnGroup: DrawnGroup.SENIOR },
					{ participantId: 4, drawnGroup: DrawnGroup.JUNIOR },
				]));

				expect(bonus.status).toBe(RaffleStatus.BONUS);
			});

			it('should stay IN_PROGRESS when more regular prizes remain', () => {
				const prize1 = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
				const prize2 = fakePrize({ rank: PrizeRank.create(1, 2), eligibleCounts: RegularEligibleCounts.create(1, 1) });
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

				const result = raffle.draw(lottery);

				expect(result.status).toBe(RaffleStatus.IN_PROGRESS);
			});
		});
	});

	describe('transitionToReady (using participants)', () => {
		it('should transition to READY when participants are sufficient', () => {
			const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(2, 1) });
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
			const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const raffle = fakeRaffle({ prizes: [prize], status: RaffleStatus.DRAFT });

			expect(() => raffle.transitionToReady()).toThrow(EmptyParticipantsError);
		});

		it('should throw InsufficientEmployeesError when senior count is insufficient', () => {
			const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(2, 1) });
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
			const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(2, 1) });
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
			const prize1 = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const prize2 = fakePrize({ rank: PrizeRank.create(1, 2), eligibleCounts: RegularEligibleCounts.create(2, 1) });
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
			const bonusPrize = fakeBonusPrize({ rank: PrizeRank.create(5, 99), eligibleCounts: BonusEligibleCounts.create(3) });

			const result = raffle.addBonusPrize(bonusPrize);

			expect(result.prizes).toHaveLength(1);
			expect(result.prizes[0].eligibleCounts).toBe(bonusPrize.eligibleCounts);
		});

		it('should auto-assign rank after existing prizes', () => {
			// Level 5 with sequences 1, 2, 3 (consecutive)
			const existingPrizes = [
				fakePrize({ rank: PrizeRank.create(5, 1) }),
				fakePrize({ rank: PrizeRank.create(5, 2) }),
				fakePrize({ rank: PrizeRank.create(5, 3) }),
			];
			const raffle = fakeRaffle({
				status: RaffleStatus.BONUS,
				prizes: existingPrizes,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
				],
			});
			const bonusPrize = fakeBonusPrize({ rank: PrizeRank.create(5, 1), eligibleCounts: BonusEligibleCounts.create(2) });

			const result = raffle.addBonusPrize(bonusPrize);

			// Should be assigned after max regular sequence (3) + 1 = 4
			expect(result.prizes[3].rank.level).toBe(5);
			expect(result.prizes[3].rank.sequence).toBe(4);
		});

		it('should auto-assign sequential ranks for multiple bonus prizes', () => {
			// Level 5 with sequences 1, 2 (consecutive)
			const existingPrizes = [
				fakePrize({ rank: PrizeRank.create(5, 1) }),
				fakePrize({ rank: PrizeRank.create(5, 2) }),
			];
			const raffle = fakeRaffle({
				status: RaffleStatus.BONUS,
				prizes: existingPrizes,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
					fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.SENIOR }),
				],
			});

			const result1 = raffle.addBonusPrize(fakeBonusPrize({ eligibleCounts: BonusEligibleCounts.create(1) }));
			const result2 = result1.addBonusPrize(fakeBonusPrize({ eligibleCounts: BonusEligibleCounts.create(1) }));

			expect(result1.prizes[2].rank.sequence).toBe(3);
			expect(result2.prizes[3].rank.sequence).toBe(4);
		});

		it('should throw InvalidRaffleStatusError when not in BONUS status', () => {
			const raffle = fakeRaffle({ status: RaffleStatus.IN_PROGRESS });
			const bonusPrize = fakeBonusPrize({ rank: PrizeRank.create(5, 1), eligibleCounts: BonusEligibleCounts.create(3) });

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
			const bonusPrize = fakeBonusPrize({ rank: PrizeRank.create(5, 1), eligibleCounts: BonusEligibleCounts.create(5) });

			expect(() => raffle.addBonusPrize(bonusPrize)).toThrow(InsufficientEmployeesError);
		});
	});

	describe('draw', () => {
		it('should throw NoPrizeToDrawError when no drawable prize', () => {
			const raffle = fakeRaffle({ prizes: [], status: RaffleStatus.READY });

			expect(() => raffle.draw()).toThrow(NoPrizeToDrawError);
		});

		it('should throw InvalidWinnerCountError for wrong counts', () => {
			const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(2, 1) });
			const raffle = fakeRaffle({
				prizes: [prize],
				status: RaffleStatus.READY,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.JUNIOR }),
				],
			});
			const wrongLottery = fixedLottery([
				{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
				{ participantId: 3, drawnGroup: DrawnGroup.JUNIOR },
			]);

			expect(() => raffle.draw(wrongLottery)).toThrow(InvalidWinnerCountError);
		});

		it('should record correct drawnGroup for winners', () => {
			const prize = fakePrize({ id: 42, rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
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

			const result = raffle.draw(lottery);

			expect(result.winners.find((w) => w.participantId === 1)?.drawnGroup).toBe(DrawnGroup.SENIOR);
			expect(result.winners.find((w) => w.participantId === 2)?.drawnGroup).toBe(DrawnGroup.JUNIOR);
		});

		it('should mark prize as drawn and create winners', () => {
			const prize = fakePrize({ id: 42, rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
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

			const result = raffle.draw(lottery);

			expect(result.prizes[0].isDrawn).toBe(true);
			expect(result.winners).toHaveLength(2);
			expect(result.winners[0].rafflePrizeId).toBe(42);
			expect(result.winners[0].id).toBeNull();
		});
	});

	describe('draw (using participants)', () => {
		it('should draw from participants', () => {
			const prize = fakePrize({ id: 1, rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
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

			const result = raffle.draw(lottery);

			expect(result.winners).toHaveLength(2);
			expect(result.winners[0].participantId).toBe(1);
			expect(result.winners[1].participantId).toBe(2);
		});

		it('should exclude already-won participants from candidates', () => {
			const prize1 = fakePrize({ id: 1, rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const prize2 = fakePrize({ id: 2, rank: PrizeRank.create(1, 2), eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const raffle = fakeRaffle({
				prizes: [prize1, prize2],
				status: RaffleStatus.READY,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.SENIOR }),
				],
			});

			const afterFirst = raffle.draw(fixedLottery([{ participantId: 1, drawnGroup: DrawnGroup.SENIOR }]));

			let receivedCandidates: readonly RaffleParticipant[] = [];
			const spyLottery: LotteryStrategy = (cands) => {
				receivedCandidates = cands;
				return [{ participantId: 2, drawnGroup: DrawnGroup.SENIOR }];
			};

			afterFirst.draw(spyLottery);

			expect(receivedCandidates).toHaveLength(1);
			expect(receivedCandidates[0].id).toBe(2);
		});

		it('should throw ParticipantAlreadyWonError if lottery returns already-won participant', () => {
			const prize1 = fakePrize({ id: 1, rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const prize2 = fakePrize({ id: 2, rank: PrizeRank.create(1, 2), eligibleCounts: RegularEligibleCounts.create(1, 1) });
			const raffle = fakeRaffle({
				prizes: [prize1, prize2],
				status: RaffleStatus.READY,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 3, employeeId: 300, role: EmployeeRole.JUNIOR }),
				],
			});

			const afterFirst = raffle.draw(fixedLottery([{ participantId: 1, drawnGroup: DrawnGroup.SENIOR }]));

			const faultyLottery = fixedLottery([
				{ participantId: 1, drawnGroup: DrawnGroup.SENIOR },
				{ participantId: 3, drawnGroup: DrawnGroup.JUNIOR },
			]);

			expect(() => afterFirst.draw(faultyLottery)).toThrow(ParticipantAlreadyWonError);
		});

		it('should accumulate winners across multiple draws', () => {
			const prize1 = fakePrize({ id: 1, rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 0) });
			const prize2 = fakePrize({ id: 2, rank: PrizeRank.create(1, 2), eligibleCounts: RegularEligibleCounts.create(0, 1) });
			const raffle = fakeRaffle({
				prizes: [prize1, prize2],
				status: RaffleStatus.READY,
				participants: [
					fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR }),
					fakeParticipant({ id: 2, employeeId: 200, role: EmployeeRole.JUNIOR }),
				],
			});

			const afterFirst = raffle.draw(fixedLottery([{ participantId: 1, drawnGroup: DrawnGroup.SENIOR }]));
			const afterSecond = afterFirst.draw(fixedLottery([{ participantId: 2, drawnGroup: DrawnGroup.JUNIOR }]));

			expect(afterSecond.winners).toHaveLength(2);
			expect(afterSecond.hasParticipantWon(1)).toBe(true);
			expect(afterSecond.hasParticipantWon(2)).toBe(true);
		});
	});

	describe('immutability', () => {
		it('should not modify original raffle after draw', () => {
			const prize = fakePrize({ rank: PrizeRank.create(1, 1), eligibleCounts: RegularEligibleCounts.create(1, 1) });
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

			raffle.draw(lottery);

			expect(raffle.status).toBe(RaffleStatus.READY);
			expect(raffle.prizes[0].isDrawn).toBe(false);
			expect(raffle.winners).toHaveLength(0);
		});

		it('should not modify original raffle after addBonusPrize', () => {
			const raffle = fakeRaffle({
				status: RaffleStatus.BONUS,
				participants: [fakeParticipant({ id: 1, employeeId: 100, role: EmployeeRole.SENIOR })],
			});
			const bonusPrize = fakeBonusPrize({ rank: PrizeRank.create(5, 1), eligibleCounts: BonusEligibleCounts.create(1) });

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
			expect(participant.tags).toEqual([]);
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
});
