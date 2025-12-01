import { DrawnGroup, EmployeeRole } from '../shared';
import type { LotteryStrategy, WinnerInput } from './lottery-strategy';
import type { PersistedParticipant } from './raffle-participant';

function shuffle<T>(array: readonly T[]): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

function drawFromPool(candidates: readonly PersistedParticipant[], count: number, group: DrawnGroup): WinnerInput[] {
	const shuffled = shuffle(candidates);
	return shuffled.slice(0, count).map((p) => ({
		participantId: p.id,
		drawnGroup: group,
	}));
}

/**
 * Default lottery implementation using random selection.
 *
 * For regular prizes: draws separately from senior and junior pools.
 * For bonus prizes: draws from all candidates combined.
 */
export const randomLottery: LotteryStrategy = (candidates, eligibleCounts) => {
	if (eligibleCounts.isRegular()) {
		const seniors = candidates.filter((c) => c.role === EmployeeRole.SENIOR);
		const juniors = candidates.filter((c) => c.role === EmployeeRole.JUNIOR);

		return [
			...drawFromPool(seniors, eligibleCounts.senior, DrawnGroup.SENIOR),
			...drawFromPool(juniors, eligibleCounts.junior, DrawnGroup.JUNIOR),
		];
	}

	return drawFromPool(candidates, eligibleCounts.total, DrawnGroup.ALL);
};
