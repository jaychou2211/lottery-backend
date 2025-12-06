import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database';
import { RaffleController } from './raffle.controller';
import { RaffleProjection } from './raffle.projection';
import { RaffleRepository } from './raffle.repository';
import { RaffleService } from './raffle.service';

@Module({
	imports: [DatabaseModule],
	controllers: [RaffleController],
	providers: [RaffleRepository, RaffleProjection, RaffleService],
	exports: [RaffleService],
})
export class RaffleModule {}
