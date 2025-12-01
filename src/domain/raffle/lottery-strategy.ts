import type { EligibleCounts, DrawnGroup } from '../shared';
import type { PersistedParticipant } from './raffle-participant';

export interface WinnerInput {
	participantId: number;
	drawnGroup: DrawnGroup;
}

/**
 * Strategy for selecting winners from candidates.
 * Can be injected for testing purposes.
 *
 * Note: Candidates are guaranteed to be persisted (have valid IDs).
 */
export type LotteryStrategy = (
	candidates: readonly PersistedParticipant[],
	eligibleCounts: EligibleCounts,
) => WinnerInput[];
