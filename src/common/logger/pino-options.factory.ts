import type { Params } from 'nestjs-pino';
import type { TransportTargetOptions } from 'pino';
import type { Options as PinoHttpOptions } from 'pino-http';

import { requestSerializer, responseSerializer } from './serializers';

interface LoggerFactoryOptions {
	level: string;
	pretty: boolean;
	autoLogging: boolean;
	file: {
		enabled: boolean;
		errorPath: string;
		warnPath: string;
		combinedPath?: string;
	};
	appName?: string;
	appVersion?: string;
}

const createPrettyTarget = (level: string): TransportTargetOptions => ({
	target: 'pino-pretty',
	level,
	options: {
		colorize: true,
		singleLine: false,
		translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
		ignore: 'pid,hostname',
	},
});

const createJsonStdoutTarget = (level: string): TransportTargetOptions => ({
	target: 'pino/file',
	level,
	options: { destination: 1 },
});

const createFileTarget = (level: string, destination: string): TransportTargetOptions => ({
	target: 'pino/file',
	level,
	options: {
		destination,
		mkdir: true,
	},
});

const createTransportTargets = (options: LoggerFactoryOptions): TransportTargetOptions[] => {
	const targets: TransportTargetOptions[] = [];

	if (options.pretty) {
		targets.push(createPrettyTarget(options.level));
	} else {
		targets.push(createJsonStdoutTarget(options.level));
	}

	if (options.file.enabled) {
		targets.push(createFileTarget('warn', options.file.warnPath));
		targets.push(createFileTarget('error', options.file.errorPath));

		if (options.file.combinedPath) {
			targets.push(createFileTarget(options.level, options.file.combinedPath));
		}
	}

	return targets;
};

const createPinoHttpOptions = (options: LoggerFactoryOptions): PinoHttpOptions => ({
	level: options.level,
	autoLogging: options.autoLogging,
	quietReqLogger: true,
	base: options.appName
		? {
			app: options.appName,
			...(options.appVersion && { version: options.appVersion }),
		}
		: null,
	genReqId: (req, res) => {
		const existingId = req.headers['x-request-id'];
		const id = (Array.isArray(existingId) ? existingId[0] : existingId) || crypto.randomUUID();

		res.setHeader('x-request-id', id);
		return id;
	},
	serializers: {
		req: requestSerializer,
		res: responseSerializer,
	},
	customSuccessMessage: (req, res) => {
		const method = req.method ?? 'UNKNOWN';
		const url = req.url ?? '/';
		const status = res.statusCode;
		return `${method} ${url} - ${status}`;
	},
	customErrorMessage: (req, res, err) => {
		const method = req.method ?? 'UNKNOWN';
		const url = req.url ?? '/';
		const status = res.statusCode;
		return `${method} ${url} - ${status} - ${err.message}`;
	},
	transport: {
		targets: createTransportTargets(options),
	},
});

export const createLoggerParams = (options: LoggerFactoryOptions): Params => ({
	pinoHttp: createPinoHttpOptions(options),
});
