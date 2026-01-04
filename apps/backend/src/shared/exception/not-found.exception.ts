import { NotFoundException } from '@nestjs/common';

import type { NotFoundError } from '../../raffle/errors';

/**
 * HTTP exception for resource not found errors.
 * Preserves the error code from the application layer.
 */
export class ResourceNotFoundException extends NotFoundException {
	constructor(error: NotFoundError) {
		super({ code: error.code, message: error.message });
	}
}
