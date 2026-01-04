import type { DrawnGroup, EligibleCounts } from '../shared';
import type { EligibilityPool } from './eligibility-pool';

export interface WinnerInput {
	participantId: number;
	drawnGroup: DrawnGroup;
}

/**
 * Strategy for selecting winners from the eligibility pool.
 * Can be injected for testing purposes.
 */
export type LotteryStrategy = (
	pool: EligibilityPool,
	eligibleCounts: EligibleCounts,
) => WinnerInput[];
