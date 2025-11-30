import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger';
import { loggerConfig } from './config/logger.config';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['.env'],
			load: [loggerConfig],
		}),
		LoggerModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
