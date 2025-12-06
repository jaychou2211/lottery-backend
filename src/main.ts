import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filter';
import { bootstrapSwagger } from './helper/api-doc';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
	});

	const logger = app.get(Logger);
	app.useLogger(logger);
	app.flushLogs();

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
