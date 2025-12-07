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
	Query,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiConflictResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiCreatedResponse,
	ApiNoContentResponse,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';

import {
	AddBonusPrizeDto,
	CreateRaffleDto,
	UpdateStatusDto,
	CreateRaffleResponseDto,
	RaffleListItemResponseDto,
	RaffleDetailResponseDto,
	DrawResultResponseDto,
	ParticipantStatusResponseDto,
	BonusPrizeResponseDto,
} from './dto';
import type {
	RaffleDetailDto,
	RaffleListItemDto,
	DrawResultDto,
	ParticipantStatusDto,
	RaffleDetailInclude,
	BonusPrizeDto,
} from './raffle.projection';
import { RaffleService } from './raffle.service';
import { RaffleStatus } from '../domain/shared';
import { ErrorResponseDto } from '../shared/dto';

@ApiTags('Raffles')
@Controller('raffles')
export class RaffleController {
	constructor(private readonly service: RaffleService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new raffle with snapshots of employees and prizes' })
	@ApiCreatedResponse({ description: 'Raffle created successfully', type: CreateRaffleResponseDto })
	async create(@Body() dto: CreateRaffleDto): Promise<{ id: number }> {
		const id = await this.service.create(dto.name);
		return { id };
	}

	@Get()
	@ApiOperation({ summary: 'List all raffles' })
	@ApiQuery({
		name: 'status',
		required: false,
		description: 'Filter by raffle status',
		enum: ['DRAFT', 'READY', 'COMPLETED'],
	})
	@ApiOkResponse({ description: 'List of raffles', type: [RaffleListItemResponseDto] })
	async getList(@Query('status') status?: string): Promise<RaffleListItemDto[]> {
		return this.service.getList(status ? { status: status as RaffleStatus } : undefined);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a raffle by ID' })
	@ApiQuery({
		name: 'include',
		required: false,
		description: 'Comma-separated fields to include in response',
		enum: ['participants', 'prizes', 'winners'],
		schema: { type: 'string' },
	})
	@ApiOkResponse({ description: 'Raffle details', type: RaffleDetailResponseDto })
	@ApiNotFoundResponse({ description: 'Raffle not found', type: ErrorResponseDto })
	async getDetail(
		@Param('id', ParseIntPipe) id: number,
		@Query('include') include?: string,
	): Promise<RaffleDetailDto> {
		const includeFields = include?.split(',').filter(Boolean) as RaffleDetailInclude[] | undefined;
		return this.service.getDetail(id, includeFields ? { include: includeFields } : undefined);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete a raffle' })
	@ApiNoContentResponse({ description: 'Raffle deleted successfully' })
	@ApiNotFoundResponse({ description: 'Raffle not found', type: ErrorResponseDto })
	async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.service.delete(id);
	}

	@Patch(':id/status')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Update raffle status' })
	@ApiNoContentResponse({ description: 'Status updated successfully' })
	@ApiNotFoundResponse({ description: 'Raffle not found', type: ErrorResponseDto })
	@ApiBadRequestResponse({ description: 'Invalid status transition', type: ErrorResponseDto })
	@ApiConflictResponse({ description: 'Concurrent modification detected', type: ErrorResponseDto })
	async updateStatus(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateStatusDto,
	): Promise<void> {
		if (dto.status === 'READY') {
			await this.service.transitionToReady(id);
		} else if (dto.status === 'COMPLETED') {
			await this.service.markAsCompleted(id);
		}
	}

	@Post(':id/draw')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Draw winners for the next prize' })
	@ApiOkResponse({ description: 'Draw result', type: DrawResultResponseDto })
	@ApiNotFoundResponse({ description: 'Raffle not found', type: ErrorResponseDto })
	@ApiBadRequestResponse({ description: 'No prizes available to draw', type: ErrorResponseDto })
	@ApiConflictResponse({ description: 'Concurrent modification detected', type: ErrorResponseDto })
	async draw(@Param('id', ParseIntPipe) id: number): Promise<DrawResultDto> {
		return this.service.draw(id);
	}

	@Post(':id/bonus-prizes')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Add a bonus prize (BONUS status only)' })
	@ApiCreatedResponse({ description: 'Bonus prize added successfully', type: BonusPrizeResponseDto })
	@ApiNotFoundResponse({ description: 'Raffle not found', type: ErrorResponseDto })
	@ApiBadRequestResponse({ description: 'Invalid status or insufficient remaining participants', type: ErrorResponseDto })
	@ApiConflictResponse({ description: 'Concurrent modification detected', type: ErrorResponseDto })
	async addBonusPrize(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: AddBonusPrizeDto,
	): Promise<BonusPrizeDto> {
		return this.service.addBonusPrize(id, dto);
	}

	@Get(':id/participants/:staffNumber')
	@ApiOperation({ summary: 'Get participant status in a raffle' })
	@ApiOkResponse({ description: 'Participant status', type: ParticipantStatusResponseDto })
	@ApiNotFoundResponse({ description: 'Participant not found', type: ErrorResponseDto })
	async getParticipantStatus(
		@Param('id', ParseIntPipe) id: number,
		@Param('staffNumber') staffNumber: string,
	): Promise<ParticipantStatusDto> {
		return this.service.getParticipantStatus(id, staffNumber);
	}
}
