import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();
		const status = exception.getStatus();
		const exceptionResponse = exception.getResponse();

		const errorBody = typeof exceptionResponse === 'string'
			? { message: exceptionResponse }
			: exceptionResponse;

		this.logger.warn({
			method: request.method,
			url: request.url,
			statusCode: status,
			error: errorBody,
		});

		response.status(status).json(errorBody);
	}
}
