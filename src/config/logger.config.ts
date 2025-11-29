import { registerAs } from '@nestjs/config';

export const loggerConfig = registerAs('logger', () => ({
	level: process.env.LOG_LEVEL || 'info',
	pretty: process.env.LOG_PRETTY === 'true',
	file: {
		enabled: process.env.LOG_FILE_ENABLED === 'true',
		errorPath: process.env.LOG_ERROR_PATH || 'logs/error.log',
		warnPath: process.env.LOG_WARN_PATH || 'logs/warn.log',
		combinedPath: process.env.LOG_COMBINED_PATH,
	},
	autoLogging: process.env.LOG_AUTO_LOGGING !== 'false',
	appName: process.env.APP_NAME || 'lottery-backend',
	appVersion: process.env.APP_VERSION,
}));

export type LoggerConfig = ReturnType<typeof loggerConfig>;
