import type { DrawnGroup } from '../shared';

export interface WinnerRecordProps {
	id?: number;
	rafflePrizeId: number;
	participantId: number;
	drawnGroup: DrawnGroup;
	createdAt: Date;
}

/**
 * Entity: WinnerRecord
 *
 * Belongs to Raffle aggregate.
 * Records which participant won which prize.
 *
 * Note: `id` is null for newly created records (before persistence).
 * Note: Uses `participantId` (not `employeeId`) to link to the snapshot.
 */
export class WinnerRecord {
	private constructor(
		public readonly id: number | null,
		public readonly rafflePrizeId: number,
		public readonly participantId: number,
		public readonly drawnGroup: DrawnGroup,
		public readonly createdAt: Date,
	) {}

	static create(props: WinnerRecordProps): WinnerRecord {
		return new WinnerRecord(
			props.id ?? null,
			props.rafflePrizeId,
			props.participantId,
			props.drawnGroup,
			props.createdAt,
		);
	}
}
