/**
 * Base class for all domain errors.
 * Provides a consistent structure for error handling across the domain layer.
 */
export abstract class DomainError extends Error {
	abstract readonly code: string;

	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}
