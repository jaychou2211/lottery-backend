import { DomainError } from '../shared/domain-error';
import type { RaffleStatus } from '../shared/raffle-status';

export class InvalidStatusTransitionError extends DomainError {
	readonly code = 'INVALID_STATUS_TRANSITION';

	constructor(
		public readonly from: RaffleStatus,
		public readonly to: RaffleStatus,
	) {
		super(`cannot transition from ${from} to ${to}`);
	}
}

export class PrizeNotFoundError extends DomainError {
	readonly code = 'PRIZE_NOT_FOUND';

	constructor(public readonly rank: number) {
		super(`no prize with rank ${rank}`);
	}
}

export class AlreadyDrawnError extends DomainError {
	readonly code = 'ALREADY_DRAWN';

	constructor(public readonly rank: number) {
		super(`prize rank ${rank} has already been drawn`);
	}
}

export class InvalidDrawOrderError extends DomainError {
	readonly code = 'INVALID_DRAW_ORDER';

	constructor(
		public readonly requestedRank: number,
		public readonly expectedRank: number | null,
	) {
		const message =
			expectedRank === null
				? `no more prizes to draw, but requested rank ${requestedRank}`
				: `must draw rank ${expectedRank} before rank ${requestedRank}`;
		super(message);
	}
}

export class ParticipantAlreadyWonError extends DomainError {
	readonly code = 'PARTICIPANT_ALREADY_WON';

	constructor(public readonly participantId: number) {
		super(`participant ${participantId} has already won a prize in this raffle`);
	}
}

export class InvalidWinnerCountError extends DomainError {
	readonly code = 'INVALID_WINNER_COUNT';

	constructor(
		public readonly group: 'senior' | 'junior' | 'all',
		public readonly expected: number,
		public readonly actual: number,
	) {
		super(`expected ${expected} ${group} winners, got ${actual}`);
	}
}

export class PrizeTypeMismatchError extends DomainError {
	readonly code = 'PRIZE_TYPE_MISMATCH';

	constructor(
		public readonly isBonus: boolean,
		public readonly status: RaffleStatus,
	) {
		const prizeType = isBonus ? 'bonus' : 'regular';
		super(`cannot draw ${prizeType} prize in ${status} status`);
	}
}

export class InsufficientEmployeesError extends DomainError {
	readonly code = 'INSUFFICIENT_EMPLOYEES';

	constructor(
		public readonly group: 'senior' | 'junior' | 'bonus',
		public readonly required: number,
		public readonly available: number,
	) {
		super(`insufficient ${group} employees: required ${required}, available ${available}`);
	}
}

export class InvalidRaffleStatusError extends DomainError {
	readonly code = 'INVALID_RAFFLE_STATUS';

	constructor(
		public readonly operation: string,
		public readonly actual: RaffleStatus,
		public readonly expected: RaffleStatus | readonly RaffleStatus[],
	) {
		const expectedStr = Array.isArray(expected) ? expected.join(' or ') : expected;
		super(`cannot ${operation} in ${actual} status, expected ${expectedStr}`);
	}
}

export class DuplicateParticipantError extends DomainError {
	readonly code = 'DUPLICATE_PARTICIPANT';

	constructor(public readonly employeeId: number) {
		super(`participant with employeeId ${employeeId} already exists`);
	}
}

export class EmptyParticipantsError extends DomainError {
	readonly code = 'EMPTY_PARTICIPANTS';

	constructor() {
		super('raffle must have at least one participant');
	}
}

export type RaffleError =
	| InvalidStatusTransitionError
	| PrizeNotFoundError
	| AlreadyDrawnError
	| InvalidDrawOrderError
	| ParticipantAlreadyWonError
	| InvalidWinnerCountError
	| PrizeTypeMismatchError
	| InsufficientEmployeesError
	| InvalidRaffleStatusError
	| DuplicateParticipantError
	| EmptyParticipantsError;
