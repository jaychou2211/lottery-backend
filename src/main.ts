import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filter';
import { bootstrapSwagger } from './helper/api-doc';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bufferLogs: true,
	});

	const logger = app.get(Logger);
	app.useLogger(logger);
	app.flushLogs();

	// Configure static assets serving
	app.useStaticAssets(join(__dirname, '..', 'public'));

	app.useGlobalPipes(new ValidationPipe({
		transform: true,
		whitelist: true,
	}));

	app.useGlobalFilters(new HttpExceptionFilter());

	bootstrapSwagger(app);

	const configService = app.get(ConfigService);
	const port = configService.get<number>('APP_PORT', 3000);

	await app.listen(port);

	logger.log(`Application listening on port ${port}`, 'Bootstrap');
}
bootstrap();
