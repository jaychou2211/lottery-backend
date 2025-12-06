import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createTestApp, closeTestApp, type TestApp } from './test-utils';

describe('AppController (e2e)', () => {
	let testApp: TestApp;
	let app: INestApplication;

	beforeAll(async () => {
		testApp = await createTestApp();
		app = testApp.app;
	});

	afterAll(async () => {
		await closeTestApp(testApp);
	});

	it('/health (GET) should return 200', async () => {
		const response = await request(app.getHttpServer()).get('/health');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: 'ok' });
	});

	it('/ (GET) should return hello message', async () => {
		const response = await request(app.getHttpServer()).get('/');

		expect(response.status).toBe(200);
		expect(response.text).toBe('Hello World!');
	});
});
