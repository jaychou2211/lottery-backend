import {
	BadRequestException,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Put,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBody,
	ApiConsumes,
	ApiNotFoundResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';

import { parsePrizeCsv } from './csv-parser';
import { PrizeResponseDto, PrizeSyncResultDto } from './dto';
import { PrizeService } from './prize.service';
import type { PrizeTemplate } from '../domain/prize-template';
import { PrizeRank } from '../domain/shared';

interface UploadedFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

@ApiTags('Prizes')
@Controller('prizes')
export class PrizeController {
	constructor(private readonly service: PrizeService) {}

	@Put()
	@UseInterceptors(FileInterceptor('file'))
	@ApiOperation({
		summary: 'Sync prize templates from CSV file',
		description: `
Replaces the entire prize template list with the data from the uploaded CSV file.

**CSV Format:**
\`\`\`
name,rank,imageUrl,senior,junior
Kiehl's 稀土深層毛孔清潔面膜,1-1,https://example.com/kiehls.jpg,2,1
露禾LOHE 磁吸翻蓋折疊購物推車65L,1-2,https://example.com/lohe.jpg,3,2
\`\`\`

**Sync Logic:**
- Prizes in CSV but not in DB → Created
- Prizes in both CSV and DB → Updated (if changed)
- Prizes in DB but not in CSV → Deleted
- Empty CSV → Deletes all prizes
		`,
	})
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					format: 'binary',
					description: 'CSV file with prize template data',
				},
			},
			required: ['file'],
		},
	})
	@ApiResponse({ status: 200, type: PrizeSyncResultDto })
	async sync(@UploadedFile() file: UploadedFile): Promise<PrizeSyncResultDto> {
		if (!file) {
			throw new BadRequestException({
				code: 'FILE_REQUIRED',
				message: 'CSV file is required',
			});
		}

		const rows = parsePrizeCsv(file.buffer);
		return this.service.sync(rows);
	}

	@Get()
	@ApiOperation({ summary: 'List all prize templates' })
	@ApiResponse({ status: 200, type: [PrizeResponseDto] })
	async findAll(): Promise<PrizeResponseDto[]> {
		const prizes = await this.service.findAll();
		return prizes.map((p) => this.toResponse(p));
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a prize template by ID' })
	@ApiResponse({ status: 200, type: PrizeResponseDto })
	@ApiNotFoundResponse({ description: 'Prize template not found' })
	async findById(@Param('id', ParseIntPipe) id: number): Promise<PrizeResponseDto> {
		const prize = await this.service.findById(id);
		return this.toResponse(prize);
	}

	private toResponse(prize: PrizeTemplate): PrizeResponseDto {
		const rank = PrizeRank.fromString(prize.rank);
		return {
			id: prize.id,
			name: prize.name,
			rank: prize.rank,
			prizeLevel: rank.levelName,
			imageUrl: prize.imageUrl,
			senior: prize.senior,
			junior: prize.junior,
		};
	}
}
