import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database';
import { PrizeController } from './prize.controller';
import { PrizeRepository } from './prize.repository';

@Module({
	imports: [DatabaseModule],
	controllers: [PrizeController],
	providers: [PrizeRepository],
})
export class PrizeModule {}
