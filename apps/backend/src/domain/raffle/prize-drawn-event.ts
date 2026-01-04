import type { DrawnGroup } from '../shared';

export class PrizeDrawnEvent {
	constructor(
		public readonly participantId: number,
		public readonly prizeId: number,
		public readonly drawnGroup: DrawnGroup,
	) {}
}
