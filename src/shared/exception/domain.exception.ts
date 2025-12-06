import { BadRequestException } from '@nestjs/common';

import type { DomainError } from '../../domain/shared/domain-error';

/**
 * HTTP exception for domain errors.
 * Preserves the error code from the domain layer.
 */
export class DomainException extends BadRequestException {
	constructor(error: DomainError) {
		super({ code: error.code, message: error.message });
	}
}
