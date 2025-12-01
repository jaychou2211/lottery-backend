import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseIntPipe,
	Patch,
	Post,
} from '@nestjs/common';
import {
	ApiNotFoundResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';

import { CreatePrizeDto, PrizeResponseDto, UpdatePrizeDto } from './dto';
import { PrizeService } from './prize.service';

@ApiTags('Prizes')
@Controller('prizes')
export class PrizeController {
	constructor(private readonly service: PrizeService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new prize template' })
	@ApiResponse({ status: 201, type: PrizeResponseDto })
	async create(@Body() dto: CreatePrizeDto): Promise<PrizeResponseDto> {
		return this.service.create(dto);
	}

	@Get()
	@ApiOperation({ summary: 'List all prize templates' })
	@ApiResponse({ status: 200, type: [PrizeResponseDto] })
	async findAll(): Promise<PrizeResponseDto[]> {
		return this.service.findAll();
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a prize template by ID' })
	@ApiResponse({ status: 200, type: PrizeResponseDto })
	@ApiNotFoundResponse({ description: 'Prize template not found' })
	async findById(@Param('id', ParseIntPipe) id: number): Promise<PrizeResponseDto> {
		return this.service.findById(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update a prize template' })
	@ApiResponse({ status: 200, type: PrizeResponseDto })
	@ApiNotFoundResponse({ description: 'Prize template not found' })
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdatePrizeDto,
	): Promise<PrizeResponseDto> {
		return this.service.update(id, dto);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete a prize template' })
	@ApiResponse({ status: 204, description: 'Prize template deleted successfully' })
	@ApiNotFoundResponse({ description: 'Prize template not found' })
	async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.service.delete(id);
	}
}
