import { faker } from '@faker-js/faker';
import type { Employee } from '../employee';
import { Raffle, RafflePrize, RaffleParticipant, WinnerRecord } from '../raffle';
import type { LotteryStrategy, WinnerInput, PersistedPrize, PersistedBonusPrize, PersistedParticipant } from '../raffle';
import { RegularEligibleCounts, BonusEligibleCounts, RaffleStatus, EmployeeRole, DrawnGroup, PrizeRank } from '../shared';
import type { EligibleCounts } from '../shared';

/**
 * Factory for creating test Employee objects.
 */
export function fakeEmployee(overrides: Partial<Employee> = {}): Employee {
	return {
		id: faker.number.int(),
		staffNumber: faker.string.alphanumeric(6),
		name: faker.person.fullName(),
		department: faker.commerce.department(),
		role: faker.helpers.enumValue(EmployeeRole),
		...overrides,
	};
}

/**
 * Factory for creating test RafflePrize objects (persisted).
 *
 * @see {@link RafflePrize}
 */
export function fakePrize(
	overrides: Partial<Omit<Parameters<typeof RafflePrize.create>[0], 'rank'>> & { rank?: PrizeRank } = {},
): PersistedPrize {
	return RafflePrize.create({
		id: faker.number.int({ min: 1 }),
		rank: overrides.rank ?? PrizeRank.create(
			faker.number.int({ min: 1, max: 5 }),
			faker.number.int({ min: 1, max: 10 }),
		),
		name: faker.commerce.productName(),
		eligibleCounts: RegularEligibleCounts.create(4, 2),
		imageUrl: faker.image.url(),
		...overrides,
	}) as PersistedPrize;
}

/**
 * Factory for creating test bonus prize (persisted).
 */
export function fakeBonusPrize(
	overrides: Partial<Omit<Parameters<typeof RafflePrize.create>[0], 'eligibleCounts' | 'rank'>> & {
		eligibleCounts?: BonusEligibleCounts;
		rank?: PrizeRank;
	} = {},
): PersistedBonusPrize {
	return RafflePrize.create({
		id: faker.number.int({ min: 1 }),
		rank: overrides.rank ?? PrizeRank.create(5, faker.number.int({ min: 1, max: 10 })),
		name: faker.commerce.productName(),
		eligibleCounts: overrides.eligibleCounts ?? BonusEligibleCounts.create(3),
		imageUrl: faker.image.url(),
		...overrides,
	}) as PersistedBonusPrize;
}

/**
 * Factory for creating test WinnerRecord objects.
 *
 * @see {@link WinnerRecord}
 */
export function fakeWinnerRecord(
	overrides: Partial<Parameters<typeof WinnerRecord.create>[0]> = {},
): WinnerRecord {
	return WinnerRecord.create({
		rafflePrizeId: faker.number.int(),
		participantId: faker.number.int(),
		drawnGroup: faker.helpers.enumValue(DrawnGroup),
		createdAt: faker.date.recent(),
		...overrides,
	});
}

/**
 * Factory for creating test Raffle objects.
 *
 * @see {@link Raffle}
 */
export function fakeRaffle(
	overrides: Partial<Parameters<typeof Raffle.create>[0]> = {},
): Raffle {
	return Raffle.create({
		id: faker.number.int(),
		name: faker.company.name(),
		prizes: [],
		...overrides,
	});
}

/**
 * Creates a fixed lottery strategy for testing.
 * Returns predetermined winners based on the provided inputs.
 *
 * Note: inputs should use participantId (not employeeId).
 *
 * @see {@link LotteryStrategy}
 */
export function fixedLottery(inputs: WinnerInput[]): LotteryStrategy {
	return () => inputs;
}

/**
 * Factory for creating test RaffleParticipant objects with ID (simulates persisted state).
 *
 * @see {@link RaffleParticipant}
 */
export function fakeParticipant(
	overrides: { id: number; employeeId: number; role: EmployeeRole } & Partial<
		Omit<Parameters<typeof RaffleParticipant.create>[0], 'id' | 'employeeId' | 'role'>
	>,
): PersistedParticipant {
	return RaffleParticipant.create({
		staffNumber: `EMP${overrides.employeeId}`,
		name: `Employee ${overrides.employeeId}`,
		department: 'Test',
		...overrides,
	}) as PersistedParticipant;
}

/**
 * Re-export commonly used types and values for convenience in tests.
 */
export { RegularEligibleCounts, BonusEligibleCounts, RaffleStatus, EmployeeRole, DrawnGroup, PrizeRank };
export type { EligibleCounts };
