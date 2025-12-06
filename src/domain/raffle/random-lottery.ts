import { DrawnGroup } from '../shared';
import type { EligibilityPool } from './eligibility-pool';
import type { LotteryStrategy, WinnerInput } from './lottery-strategy';

function shuffle<T>(array: readonly T[]): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

function drawFromPool(ids: readonly number[], count: number, group: DrawnGroup): WinnerInput[] {
	const shuffled = shuffle(ids);
	return shuffled.slice(0, count).map((id) => ({
		participantId: id,
		drawnGroup: group,
	}));
}

/**
 * Default lottery implementation using random selection.
 *
 * For regular prizes: draws separately from senior and junior pools.
 * For bonus prizes: draws from all candidates combined.
 */
export const randomLottery: LotteryStrategy = (pool: EligibilityPool, eligibleCounts) => {
	if (eligibleCounts.isRegular()) {
		const seniorIds = pool.getEligibleIds(DrawnGroup.SENIOR);
		const juniorIds = pool.getEligibleIds(DrawnGroup.JUNIOR);

		return [
			...drawFromPool(seniorIds, eligibleCounts.senior, DrawnGroup.SENIOR),
			...drawFromPool(juniorIds, eligibleCounts.junior, DrawnGroup.JUNIOR),
		];
	}

	const allIds = pool.getEligibleIds(DrawnGroup.ALL);
	return drawFromPool(allIds, eligibleCounts.total, DrawnGroup.ALL);
};
