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

export class NoPrizeToDrawError extends DomainError {
	readonly code = 'NO_PRIZE_TO_DRAW';

	constructor() {
		super('no prizes available to draw');
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

export class UnexpectedRankError extends DomainError {
	readonly code = 'UNEXPECTED_RANK';

	constructor(
		public readonly expected: string,
		public readonly actual: string,
	) {
		super(`cannot draw rank ${actual}: expected ${expected} to be drawn next`);
	}
}

export type RaffleError =
	| InvalidStatusTransitionError
	| NoPrizeToDrawError
	| ParticipantAlreadyWonError
	| InvalidWinnerCountError
	| InsufficientEmployeesError
	| InvalidRaffleStatusError
	| DuplicateParticipantError
	| EmptyParticipantsError
	| UnexpectedRankError;
