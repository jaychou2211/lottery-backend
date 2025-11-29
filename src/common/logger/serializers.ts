import type { IncomingMessage, ServerResponse } from 'http';

interface SerializedRequest {
	id: string;
	method: string;
	url: string;
	query?: Record<string, unknown>;
	body?: unknown;
}

interface SerializedResponse {
	statusCode: number;
	responseTime?: number;
}

export const requestSerializer = (req: IncomingMessage & { id?: string; body?: unknown; query?: Record<string, unknown> }): SerializedRequest => {
	const result: SerializedRequest = {
		id: req.id ?? 'unknown',
		method: req.method ?? 'UNKNOWN',
		url: req.url ?? '/',
	};

	if (req.query && Object.keys(req.query).length > 0) {
		result.query = req.query;
	}

	if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
		result.body = req.body;
	}

	return result;
};

export const responseSerializer = (res: ServerResponse & { responseTime?: number }): SerializedResponse => ({
	statusCode: res.statusCode,
	...(res.responseTime !== undefined && { responseTime: res.responseTime }),
});
