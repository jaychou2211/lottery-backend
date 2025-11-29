import { Controller, Get } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { AppService } from './app.service';

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly logger: Logger,
	) {}

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	@Get('health')
	getHealth(): { status: string } {
		return { status: 'ok' };
	}

	@Get('log/test')
	testLogs(): { message: string } {
		this.logger.debug('This is a DEBUG message');
		this.logger.log('This is an INFO message');
		this.logger.warn('This is a WARN message');
		this.logger.error('This is an ERROR message');

		return { message: 'Logs emitted at all levels. Check stdout and log files.' };
	}
}
