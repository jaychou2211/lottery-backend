import { ConflictException } from '@nestjs/common';

import type { ConcurrencyError } from '../../raffle/errors';

/**
 * HTTP exception for optimistic locking conflicts.
 * Preserves the error code from the application layer.
 */
export class OptimisticLockException extends ConflictException {
	constructor(error: ConcurrencyError) {
		super({ code: error.code, message: error.message });
	}
}
