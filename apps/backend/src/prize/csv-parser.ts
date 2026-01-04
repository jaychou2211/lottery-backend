import { BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

import type { PrizeCsvRow } from './dto/sync-prize.dto';

const REQUIRED_HEADERS = ['name', 'rank', 'imageUrl', 'senior', 'junior'] as const;
const RANK_PATTERN = /^[1-5]-\d+$/;

interface CsvParseError {
	row: number;
	field: string;
	message: string;
}

/**
 * Parses and validates a prize CSV file buffer.
 *
 * Expected CSV format:
 * ```
 * name,rank,imageUrl,senior,junior
 * Kiehl's 稀土深層毛孔清潔面膜,1-1,https://example.com/kiehls.jpg,2,1
 * 露禾LOHE 磁吸翻蓋折疊購物推車65L,1-2,https://example.com/lohe.jpg,3,2
 * ```
 *
 * @throws BadRequestException if CSV is invalid
 */
export function parsePrizeCsv(buffer: Buffer): PrizeCsvRow[] {
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
	const ranks = new Set<string>();
	const rows: PrizeCsvRow[] = [];

	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		const rowNum = i + 2; // +2 for header row and 1-based index

		// Validate required string fields
		for (const field of ['name', 'rank', 'imageUrl'] as const) {
			if (!record[field]?.trim()) {
				errors.push({ row: rowNum, field, message: `${field} is required` });
			}
		}

		// Validate rank format
		const rank = record['rank']?.trim();
		if (rank && !RANK_PATTERN.test(rank)) {
			errors.push({
				row: rowNum,
				field: 'rank',
				message: `Invalid rank format: ${rank}. Must be "{level}-{sequence}" where level is 1-5`,
			});
		}

		// Check for duplicate rank within CSV
		if (rank) {
			if (ranks.has(rank)) {
				errors.push({
					row: rowNum,
					field: 'rank',
					message: `Duplicate rank: ${rank}`,
				});
			} else {
				ranks.add(rank);
			}
		}

		// Validate senior as non-negative integer
		const seniorStr = record['senior']?.trim();
		const senior = parseInt(seniorStr, 10);
		if (seniorStr === '' || seniorStr === undefined) {
			errors.push({ row: rowNum, field: 'senior', message: 'senior is required' });
		} else if (isNaN(senior) || senior < 0 || !Number.isInteger(senior)) {
			errors.push({
				row: rowNum,
				field: 'senior',
				message: `Invalid senior value: ${seniorStr}. Must be a non-negative integer`,
			});
		}

		// Validate junior as non-negative integer
		const juniorStr = record['junior']?.trim();
		const junior = parseInt(juniorStr, 10);
		if (juniorStr === '' || juniorStr === undefined) {
			errors.push({ row: rowNum, field: 'junior', message: 'junior is required' });
		} else if (isNaN(junior) || junior < 0 || !Number.isInteger(junior)) {
			errors.push({
				row: rowNum,
				field: 'junior',
				message: `Invalid junior value: ${juniorStr}. Must be a non-negative integer`,
			});
		}

		// Only add valid rows
		if (errors.filter((e) => e.row === rowNum).length === 0) {
			rows.push({
				name: record['name'].trim(),
				rank: record['rank'].trim(),
				imageUrl: record['imageUrl'].trim(),
				senior,
				junior,
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
