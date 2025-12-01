import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database';
import { RaffleController } from './raffle.controller';
import { RaffleRepository } from './raffle.repository';
import { RaffleService } from './raffle.service';

@Module({
	imports: [DatabaseModule],
	controllers: [RaffleController],
	providers: [RaffleRepository, RaffleService],
	exports: [RaffleService],
})
export class RaffleModule {}
