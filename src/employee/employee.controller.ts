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
	ApiConflictResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';

import { CreateEmployeeDto, EmployeeResponseDto, UpdateEmployeeDto } from './dto';
import { EmployeeService } from './employee.service';

@ApiTags('Employees')
@Controller('employees')
export class EmployeeController {
	constructor(private readonly service: EmployeeService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new employee' })
	@ApiResponse({ status: 201, type: EmployeeResponseDto })
	@ApiConflictResponse({ description: 'Staff number already exists' })
	async create(@Body() dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
		return this.service.create(dto);
	}

	@Get()
	@ApiOperation({ summary: 'List all employees' })
	@ApiResponse({ status: 200, type: [EmployeeResponseDto] })
	async findAll(): Promise<EmployeeResponseDto[]> {
		return this.service.findAll();
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get an employee by ID' })
	@ApiResponse({ status: 200, type: EmployeeResponseDto })
	@ApiNotFoundResponse({ description: 'Employee not found' })
	async findById(@Param('id', ParseIntPipe) id: number): Promise<EmployeeResponseDto> {
		return this.service.findById(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update an employee' })
	@ApiResponse({ status: 200, type: EmployeeResponseDto })
	@ApiNotFoundResponse({ description: 'Employee not found' })
	@ApiConflictResponse({ description: 'Staff number already exists' })
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateEmployeeDto,
	): Promise<EmployeeResponseDto> {
		return this.service.update(id, dto);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete an employee' })
	@ApiResponse({ status: 204, description: 'Employee deleted successfully' })
	@ApiNotFoundResponse({ description: 'Employee not found' })
	async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.service.delete(id);
	}
}
