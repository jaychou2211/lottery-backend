import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database';
import { PrizeController } from './prize.controller';
import { PrizeRepository } from './prize.repository';
import { PrizeService } from './prize.service';

@Module({
	imports: [DatabaseModule],
	controllers: [PrizeController],
	providers: [PrizeRepository, PrizeService],
	exports: [PrizeService],
})
export class PrizeModule {}
