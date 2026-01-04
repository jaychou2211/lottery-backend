import { BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

import type { EmployeeCsvRow } from './dto/sync-employee.dto';
import { EmployeeRole } from '../domain/shared';

const REQUIRED_HEADERS = ['staffNumber', 'name', 'department', 'role'] as const;
const VALID_ROLES = Object.values(EmployeeRole);

interface CsvParseError {
	row: number;
	field: string;
	message: string;
}

/**
 * Parses and validates an employee CSV file buffer.
 *
 * Expected CSV format:
 * ```
 * staffNumber,name,department,role
 * A001,王小明,研發部,SENIOR
 * A002,李小華,行銷部,JUNIOR
 * ```
 *
 * @throws BadRequestException if CSV is invalid
 */
export function parseEmployeeCsv(buffer: Buffer): EmployeeCsvRow[] {
	const content = buffer.toString('utf-8');

	let records: Record<string, string>[];
	try {
		records = parse(content, {
			columns: true,
			skip_empty_lines: true,
			trim: true,
		});
	} catch {
		throw new BadRequestException({
			code: 'INVALID_CSV_FORMAT',
			message: 'Failed to parse CSV file. Please check the format.',
		});
	}

	// Empty CSV is valid - means delete all
	if (records.length === 0) {
		return [];
	}

	// Validate headers
	const headers = Object.keys(records[0]);
	const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
	if (missingHeaders.length > 0) {
		throw new BadRequestException({
			code: 'MISSING_HEADERS',
			message: `Missing required headers: ${missingHeaders.join(', ')}`,
		});
	}

	const errors: CsvParseError[] = [];
	const staffNumbers = new Set<string>();
	const rows: EmployeeCsvRow[] = [];

	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		const rowNum = i + 2; // +2 for header row and 1-based index

		// Validate required fields
		for (const field of REQUIRED_HEADERS) {
			if (!record[field]?.trim()) {
				errors.push({ row: rowNum, field, message: `${field} is required` });
			}
		}

		// Validate role
		const role = record['role']?.trim().toUpperCase();
		if (role && !VALID_ROLES.includes(role as EmployeeRole)) {
			errors.push({
				row: rowNum,
				field: 'role',
				message: `Invalid role: ${record['role']}. Must be one of: ${VALID_ROLES.join(', ')}`,
			});
		}

		// Check for duplicate staffNumber within CSV
		const staffNumber = record['staffNumber']?.trim();
		if (staffNumber) {
			if (staffNumbers.has(staffNumber)) {
				errors.push({
					row: rowNum,
					field: 'staffNumber',
					message: `Duplicate staffNumber: ${staffNumber}`,
				});
			} else {
				staffNumbers.add(staffNumber);
			}
		}

		// Only add valid rows
		if (errors.filter((e) => e.row === rowNum).length === 0) {
			rows.push({
				staffNumber: record['staffNumber'].trim(),
				name: record['name'].trim(),
				department: record['department'].trim(),
				role: role as EmployeeRole,
			});
		}
	}

	if (errors.length > 0) {
		const errorMessages = errors.map((e) => `Row ${e.row}: ${e.message}`).join('; ');
		throw new BadRequestException({
			code: 'INVALID_CSV_DATA',
			message: `Validation errors: ${errorMessages}`,
			errors,
		});
	}

	return rows;
}
