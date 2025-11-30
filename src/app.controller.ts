import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { AppService } from './app.service';

@ApiTags('Application')
@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly logger: Logger,
	) {}

	@Get()
	@ApiOperation({ summary: 'Root' })
	getHello(): string {
		return this.appService.getHello();
	}

	@Get('health')
	@ApiOperation({ summary: 'Health check' })
	getHealth(): { status: string } {
		return { status: 'ok' };
	}

	@Get('log/test')
	@ApiOperation({ summary: 'Log test' })
	testLogs(): { message: string } {
		this.logger.debug('This is a DEBUG message');
		this.logger.log('This is an INFO message');
		this.logger.warn('This is a WARN message');
		this.logger.error('This is an ERROR message');

		return { message: 'Logs emitted at all levels. Check stdout and log files.' };
	}
}
