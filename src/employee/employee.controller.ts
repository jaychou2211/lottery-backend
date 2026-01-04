import {
	BadRequestException,
	Controller,
	Get,
	Put,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBody,
	ApiConsumes,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { parseEmployeeCsv } from './csv-parser';
import { EmployeeResponseDto, SyncResultDto } from './dto';
import { EmployeeRepository } from './employee.repository';
import type { EmployeeRow } from '../database';
import { EmployeeRole } from '../domain/shared';

interface UploadedFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

@ApiTags('Employees')
@Controller('employees')
export class EmployeeController {
	constructor(private readonly repository: EmployeeRepository) {}

	@Put()
	@UseInterceptors(FileInterceptor('file'))
	@ApiOperation({
		summary: 'Sync employees from CSV file',
		description: `
Replaces the entire employee list with the data from the uploaded CSV file.

**CSV Format:**
\`\`\`
staffNumber,name,department,role
A001,王小明,研發部,SENIOR
A002,李小華,行銷部,JUNIOR
\`\`\`

**Sync Logic:**
- Employees in CSV but not in DB → Created
- Employees in both CSV and DB → Updated (if changed)
- Employees in DB but not in CSV → Deleted
- Empty CSV → Deletes all employees
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
					description: 'CSV file with employee data',
				},
			},
			required: ['file'],
		},
	})
	@ApiResponse({ status: 200, type: SyncResultDto })
	async sync(@UploadedFile() file: UploadedFile): Promise<SyncResultDto> {
		if (!file) {
			throw new BadRequestException({
				code: 'FILE_REQUIRED',
				message: 'CSV file is required',
			});
		}

		const rows = parseEmployeeCsv(file.buffer);
		const result = await this.repository.sync(rows);
		const currentEmployees = await this.repository.findAll();
		return { ...result, total: currentEmployees.length };
	}

	@Get()
	@ApiOperation({ summary: 'List all employees' })
	@ApiResponse({ status: 200, type: [EmployeeResponseDto] })
	async findAll(): Promise<EmployeeResponseDto[]> {
		const employees = await this.repository.findAll();
		return employees.map((e) => this.toResponse(e));
	}

	private toResponse(row: EmployeeRow): EmployeeResponseDto {
		return {
			id: row.id,
			staffNumber: row.staff_number,
			name: row.name,
			department: row.department,
			role: row.role as EmployeeRole,
		};
	}
}
