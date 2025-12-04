import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseIntPipe,
	Post,
	Patch,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';

import {
	AddBonusPrizeDto,
	AddParticipantsDto,
	AddPrizesDto,
	CreateRaffleDto,
	DrawDto,
	MarkAttendanceDto,
	RaffleResponseDto,
	RaffleSummaryDto,
	type EligibleCountsResponseDto,
	type ParticipantResponseDto,
	type PrizeResponseDto,
	type WinnerResponseDto,
} from './dto';
import { RaffleService } from './raffle.service';
import { Raffle } from '../domain/raffle';
import { EmployeeService } from '../employee';

@ApiTags('Raffles')
@Controller('raffles')
export class RaffleController {
	constructor(
		private readonly service: RaffleService,
		private readonly employeeService: EmployeeService,
	) {}

	@Post()
	@ApiOperation({ summary: 'Create a new raffle' })
	@ApiResponse({ status: 201, type: RaffleResponseDto })
	async create(@Body() dto: CreateRaffleDto): Promise<RaffleResponseDto> {
		const raffle = await this.service.create(dto.name);
		return this.toResponse(raffle);
	}

	@Get()
	@ApiOperation({ summary: 'List all raffles' })
	@ApiResponse({ status: 200, type: [RaffleSummaryDto] })
	async findAll(): Promise<RaffleSummaryDto[]> {
		const raffles = await this.service.findAll();
		return raffles.map(this.toSummary);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a raffle by ID' })
	@ApiResponse({ status: 200, type: RaffleResponseDto })
	@ApiNotFoundResponse({ description: 'Raffle not found' })
	async findById(@Param('id', ParseIntPipe) id: number): Promise<RaffleResponseDto> {
		const raffle = await this.service.findById(id);
		return this.toResponse(raffle);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete a raffle' })
	@ApiResponse({ status: 204, description: 'Raffle deleted successfully' })
	@ApiNotFoundResponse({ description: 'Raffle not found' })
	async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.service.delete(id);
	}

	@Post(':id/prizes')
	@ApiOperation({ summary: 'Add prizes to a raffle (DRAFT status only)' })
	@ApiResponse({ status: 201, type: RaffleResponseDto })
	@ApiNotFoundResponse({ description: 'Raffle not found' })
	@ApiBadRequestResponse({ description: 'Invalid status or prize configuration' })
	async addPrizes(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: AddPrizesDto,
	): Promise<RaffleResponseDto> {
		const raffle = await this.service.addPrizes(id, dto.prizes);
		return this.toResponse(raffle);
	}

	@Post(':id/participants')
	@ApiOperation({ summary: 'Add participants to a raffle (DRAFT status only)' })
	@ApiResponse({ status: 201, type: RaffleResponseDto })
	@ApiNotFoundResponse({ description: 'Raffle not found' })
	@ApiBadRequestResponse({ description: 'Invalid status or duplicate participants' })
	async addParticipants(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: AddParticipantsDto,
	): Promise<RaffleResponseDto> {
		const employees = await this.employeeService.findByIds(dto.employeeIds);
		const raffle = await this.service.addParticipants(id, employees);
		return this.toResponse(raffle);
	}

	@Patch(':id/attendance')
	@ApiOperation({ summary: 'Mark attendance for participants (DRAFT/READY status only)' })
	@ApiResponse({ status: 200, type: RaffleResponseDto })
	@ApiNotFoundResponse({ description: 'Raffle not found' })
	@ApiBadRequestResponse({ description: 'Invalid status or participant not found' })
	async markAttendance(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: MarkAttendanceDto,
	): Promise<RaffleResponseDto> {
		const raffle = await this.service.markAttendance(id, dto.records);
		return this.toResponse(raffle);
	}

	@Post(':id/ready')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Transition raffle to READY status' })
	@ApiResponse({ status: 200, type: RaffleResponseDto })
	@ApiNotFoundResponse({ description: 'Raffle not found' })
	@ApiBadRequestResponse({ description: 'Invalid status transition or insufficient participants' })
	async transitionToReady(@Param('id', ParseIntPipe) id: number): Promise<RaffleResponseDto> {
		const raffle = await this.service.transitionToReady(id);
		return this.toResponse(raffle);
	}

	@Post(':id/draw')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Draw winners for a prize' })
	@ApiResponse({ status: 200, type: RaffleResponseDto })
	@ApiNotFoundResponse({ description: 'Raffle not found' })
	@ApiBadRequestResponse({ description: 'Invalid draw operation' })
	async draw(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: DrawDto,
	): Promise<RaffleResponseDto> {
		const raffle = await this.service.draw(id, dto.rank);
		return this.toResponse(raffle);
	}

	@Post(':id/bonus-prizes')
	@ApiOperation({ summary: 'Add a bonus prize (BONUS status only)' })
	@ApiResponse({ status: 201, type: RaffleResponseDto })
	@ApiNotFoundResponse({ description: 'Raffle not found' })
	@ApiBadRequestResponse({ description: 'Invalid status or insufficient remaining participants' })
	async addBonusPrize(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: AddBonusPrizeDto,
	): Promise<RaffleResponseDto> {
		const raffle = await this.service.addBonusPrize(id, dto);
		return this.toResponse(raffle);
	}

	@Post(':id/complete')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Mark raffle as completed (BONUS status only)' })
	@ApiResponse({ status: 200, type: RaffleResponseDto })
	@ApiNotFoundResponse({ description: 'Raffle not found' })
	@ApiBadRequestResponse({ description: 'Invalid status transition' })
	async markAsCompleted(@Param('id', ParseIntPipe) id: number): Promise<RaffleResponseDto> {
		const raffle = await this.service.markAsCompleted(id);
		return this.toResponse(raffle);
	}

	private toResponse(raffle: Raffle): RaffleResponseDto {
		return {
			id: raffle.id,
			name: raffle.name,
			status: raffle.status,
			participants: raffle.participants.map((p): ParticipantResponseDto => ({
				id: p.id!,
				employeeId: p.employeeId,
				staffNumber: p.staffNumber,
				name: p.name,
				department: p.department,
				role: p.role,
				attended: p.attended,
			})),
			prizes: raffle.prizes.map((p): PrizeResponseDto => ({
				id: p.id,
				rank: p.rank,
				name: p.name,
				prizeLevel: p.prizeLevel,
				imageUrl: p.imageUrl,
				eligibleCounts: this.toEligibleCountsResponse(p.eligibleCounts),
				isDrawn: p.isDrawn,
				prizeTemplateId: p.prizeTemplateId,
			})),
			winners: raffle.winners.map((w): WinnerResponseDto => ({
				id: w.id!,
				rafflePrizeId: w.rafflePrizeId,
				participantId: w.participantId,
				drawnGroup: w.drawnGroup,
				createdAt: w.createdAt.toISOString(),
			})),
		};
	}

	private toSummary(raffle: Raffle): RaffleSummaryDto {
		return {
			id: raffle.id,
			name: raffle.name,
			status: raffle.status,
			participantCount: raffle.participants.length,
			prizeCount: raffle.prizes.length,
			winnerCount: raffle.winners.length,
		};
	}

	private toEligibleCountsResponse(ec: { isBonus(): boolean; isRegular(): boolean; total: number }): EligibleCountsResponseDto {
		if (ec.isBonus()) {
			return { kind: 'bonus', total: ec.total };
		}
		// Type guard ensures this is RegularEligibleCounts
		const regular = ec as unknown as { total: number; senior: number; junior: number };
		return {
			kind: 'regular',
			total: regular.total,
			senior: regular.senior,
			junior: regular.junior,
		};
	}
}
