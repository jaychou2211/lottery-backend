import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
	ApiExtraModels,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
	DemoErrorDto,
	DemoExceptionDto,
	DemoRequestDto,
	DemoResponseDto,
	DemoResultDto,
	DemoSuccessDto,
} from './demo.dto';
import { DEMO_API_TAG } from './index';

@ApiTags(DEMO_API_TAG)
@ApiExtraModels(DemoSuccessDto, DemoErrorDto)
@Controller('demo')
export class DemoController {
	@Post()
	@ApiOperation({ summary: 'Request/Response demo' })
	@ApiResponse({ status: 201, type: DemoResponseDto })
	@ApiUnauthorizedResponse({ type: DemoExceptionDto, description: 'Invalid token' })
	@ApiForbiddenResponse({ type: DemoExceptionDto, description: 'No permission' })
	@ApiNotFoundResponse({ type: DemoExceptionDto, description: 'Not found' })
	create(@Body() dto: DemoRequestDto): DemoResponseDto {
		return {
			id: 1,
			attr1: dto.name,
			attr2: dto.optional ?? null,
			createdAt: new Date().toISOString(),
		};
	}

	@Get('result')
	@ApiOperation({ summary: 'oneOf demo' })
	@ApiResponse({ status: 200, type: DemoResultDto })
	getResult(@Query('fail') fail?: string): DemoResultDto {
		if (fail === 'true') {
			return { result: { ok: false, code: 'ERR', message: 'Failed' } };
		}
		return {
			result: {
				ok: true,
				data: { id: 1, attr1: 'value', attr2: null, createdAt: new Date().toISOString() },
			},
		};
	}
}
