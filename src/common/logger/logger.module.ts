import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import { createLoggerParams } from './pino-options.factory';
import type { LoggerConfig } from '../../config/logger.config';

@Module({
	imports: [
		PinoLoggerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const config = configService.get<LoggerConfig>('logger');

				if (!config) {
					throw new Error('Logger configuration not found');
				}

				return createLoggerParams({
					level: config.level,
					pretty: config.pretty,
					autoLogging: config.autoLogging,
					file: config.file,
					appName: config.appName,
					appVersion: config.appVersion,
				});
			},
		}),
	],
	exports: [PinoLoggerModule],
})
export class LoggerModule {}
