import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database';
import { EmployeeModule } from '../employee';
import { PrizeModule } from '../prize';
import { RaffleController } from './raffle.controller';
import { RaffleRepository } from './raffle.repository';
import { RaffleService } from './raffle.service';

@Module({
	imports: [DatabaseModule, EmployeeModule, PrizeModule],
	controllers: [RaffleController],
	providers: [RaffleRepository, RaffleService],
	exports: [RaffleService],
})
export class RaffleModule {}
