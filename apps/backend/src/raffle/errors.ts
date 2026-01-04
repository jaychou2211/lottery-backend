/**
 * Thrown when optimistic locking detects a concurrent modification.
 */
export class ConcurrencyError extends Error {
	readonly code = 'CONCURRENCY_ERROR';

	constructor(message = 'Resource was modified by another request') {
		super(message);
		this.name = 'ConcurrencyError';
	}
}

/**
 * Thrown when a requested resource is not found.
 */
export class NotFoundError extends Error {
	readonly code = 'NOT_FOUND';

	constructor(
		public readonly resource: string,
		public readonly id: number | string,
	) {
		super(`${resource} with id ${id} not found`);
		this.name = 'NotFoundError';
	}
}
