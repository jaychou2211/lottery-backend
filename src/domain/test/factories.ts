import { faker } from '@faker-js/faker';

import type { Employee } from '../employee';
import { Raffle, Prize, EligibilityPool } from '../raffle';
import type { LotteryStrategy, WinnerInput, PersistedPrize, PersistedBonusPrize, ParticipantEligibility } from '../raffle';
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
 * Factory for creating test Prize objects (persisted).
 *
 * @see {@link Prize}
 */
export function fakePrize(
	overrides: Partial<Omit<Parameters<typeof Prize.create>[0], 'rank'>> & { rank?: PrizeRank } = {},
): PersistedPrize {
	return Prize.create({
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
	overrides: Partial<Omit<Parameters<typeof Prize.create>[0], 'eligibleCounts' | 'rank'>> & {
		eligibleCounts?: BonusEligibleCounts;
		rank?: PrizeRank;
	} = {},
): PersistedBonusPrize {
	return Prize.create({
		id: faker.number.int({ min: 1 }),
		rank: overrides.rank ?? PrizeRank.create(6, faker.number.int({ min: 1, max: 10 })),
		name: faker.commerce.productName(),
		eligibleCounts: overrides.eligibleCounts ?? BonusEligibleCounts.create(3),
		imageUrl: faker.image.url(),
		...overrides,
	}) as PersistedBonusPrize;
}

/**
 * Factory for creating test ParticipantEligibility objects.
 */
export function fakeParticipantEligibility(
	overrides: Partial<ParticipantEligibility> = {},
): ParticipantEligibility {
	return {
		id: faker.number.int({ min: 1 }),
		role: faker.helpers.enumValue(EmployeeRole),
		...overrides,
	};
}

/**
 * Factory for creating test EligibilityPool objects.
 */
export function fakeEligibilityPool(
	participants: ParticipantEligibility[] = [],
	wonIds: Set<number> = new Set(),
): EligibilityPool {
	return EligibilityPool.create(participants, wonIds);
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
		version: 1,
		status: RaffleStatus.DRAFT,
		eligibilityPool: overrides.eligibilityPool ?? fakeEligibilityPool(),
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
 * Re-export commonly used types and values for convenience in tests.
 */
export { RegularEligibleCounts, BonusEligibleCounts, RaffleStatus, EmployeeRole, DrawnGroup, PrizeRank };
export type { EligibleCounts };
