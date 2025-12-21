import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { RaffleStatus, EmployeeRole, DrawnGroup } from '../../domain/shared';

// ============================================================
// Raffle List
// ============================================================

export class RaffleListItemResponseDto {
	@ApiProperty({ example: 1 })
	id: number;

	@ApiProperty({ example: '2024 Year-End Raffle' })
	name: string;

	@ApiProperty({ enum: RaffleStatus, example: RaffleStatus.DRAFT })
	status: RaffleStatus;

	@ApiProperty({ example: 150 })
	participantCount: number;

	@ApiProperty({ example: 10 })
	prizeCount: number;

	@ApiProperty({ example: 5 })
	winnerCount: number;
}

// ============================================================
// Raffle Detail
// ============================================================

export class ParticipantResponseDto {
	@ApiProperty({ example: 1 })
	id: number;

	@ApiProperty({ example: 42 })
	employeeId: number;

	@ApiProperty({ example: 'EMP001' })
	staffNumber: string;

	@ApiProperty({ example: 'John Doe' })
	name: string;

	@ApiProperty({ example: 'Engineering' })
	department: string;

	@ApiProperty({ enum: EmployeeRole, example: EmployeeRole.SENIOR })
	role: EmployeeRole;

	@ApiProperty({ type: [String], example: ['team-lead', 'remote'] })
	tags: string[];
}

// ============================================================
// Draw Progress (must be defined before RaffleDetailResponseDto)
// ============================================================

export class DrawProgressEligibleCountsResponseDto {
	@ApiProperty({ enum: ['regular', 'bonus'], example: 'regular' })
	kind: 'regular' | 'bonus';

	@ApiProperty({ example: 5 })
	total: number;

	@ApiPropertyOptional({ example: 3 })
	senior?: number;

	@ApiPropertyOptional({ example: 2 })
	junior?: number;
}

export class DrawProgressPrizeResponseDto {
	@ApiProperty({ example: 1 })
	id: number;

	@ApiProperty({ example: 'iPhone 15 Pro' })
	name: string;

	@ApiProperty({ description: 'Prize rank in format "{level}-{sequence}"', example: '1-1' })
	rank: string;

	@ApiProperty({ description: 'Prize level display name', example: '小獎' })
	prizeLevel: string;

	@ApiProperty({ example: 'https://example.com/iphone.jpg' })
	imageUrl: string;

	@ApiProperty({ type: DrawProgressEligibleCountsResponseDto })
	eligibleCounts: DrawProgressEligibleCountsResponseDto;
}

export class DrawProgressResponseDto {
	@ApiProperty({
		type: DrawProgressPrizeResponseDto,
		nullable: true,
		description: 'The last drawn prize, or null if no prizes have been drawn yet',
	})
	lastDrawn: DrawProgressPrizeResponseDto | null;

	@ApiProperty({
		type: [DrawProgressPrizeResponseDto],
		description: 'Next prizes to be drawn (up to 2)',
	})
	upcoming: DrawProgressPrizeResponseDto[];
}

// ============================================================
// Raffle Detail
// ============================================================

export class RaffleDetailResponseDto {
	@ApiProperty({ example: 1 })
	id: number;

	@ApiProperty({ example: '2024 Year-End Raffle' })
	name: string;

	@ApiProperty({ enum: RaffleStatus, example: RaffleStatus.IN_PROGRESS })
	status: RaffleStatus;

	@ApiPropertyOptional({ type: [ParticipantResponseDto] })
	participants?: ParticipantResponseDto[];

	@ApiPropertyOptional({
		description: 'Draw results keyed by prize rank. Only includes drawn prizes.',
		type: 'object',
		additionalProperties: { $ref: '#/components/schemas/DrawResultResponseDto' },
		example: {
			'1-1': {
				winners: [{ participantId: 42, staffNumber: 'EMP001', name: 'John Doe', department: 'Engineering', role: 'SENIOR', drawnGroup: 'SENIOR' }],
				prize: { id: 1, name: 'iPhone 15 Pro', rank: '1-1', prizeLevel: '特獎', imageUrl: 'https://example.com/iphone.jpg' },
				drawnAt: '2024-12-06T10:30:00.000Z',
			},
		},
	})
	drawResults?: Record<string, DrawResultResponseDto>;

	@ApiPropertyOptional({ type: () => DrawProgressResponseDto })
	drawProgress?: DrawProgressResponseDto;
}

// ============================================================
// Draw Result
// ============================================================

export class DrawResultWinnerResponseDto {
	@ApiProperty({ example: 42 })
	participantId: number;

	@ApiProperty({ example: 'EMP001' })
	staffNumber: string;

	@ApiProperty({ example: 'John Doe' })
	name: string;

	@ApiProperty({ example: 'Engineering' })
	department: string;

	@ApiProperty({ enum: EmployeeRole, example: EmployeeRole.SENIOR })
	role: EmployeeRole;

	@ApiProperty({ enum: DrawnGroup, example: DrawnGroup.SENIOR })
	drawnGroup: DrawnGroup;
}

export class DrawResultPrizeResponseDto {
	@ApiProperty({ example: 1 })
	id: number;

	@ApiProperty({ example: 'iPhone 15 Pro' })
	name: string;

	@ApiProperty({ description: 'Prize rank in format "{level}-{sequence}"', example: '1-1' })
	rank: string;

	@ApiProperty({ description: 'Prize level display name', example: '特獎' })
	prizeLevel: string;

	@ApiProperty({ example: 'https://example.com/iphone.jpg' })
	imageUrl: string;
}

export class DrawResultResponseDto {
	@ApiProperty({ type: [DrawResultWinnerResponseDto] })
	winners: DrawResultWinnerResponseDto[];

	@ApiProperty({ type: DrawResultPrizeResponseDto })
	prize: DrawResultPrizeResponseDto;

	@ApiProperty({ example: '2024-12-06T10:30:00.000Z' })
	drawnAt: string;
}

// ============================================================
// Participant Status
// ============================================================

export class ParticipantInfoResponseDto {
	@ApiProperty({ example: 42 })
	id: number;

	@ApiProperty({ example: 'EMP001' })
	staffNumber: string;

	@ApiProperty({ example: 'John Doe' })
	name: string;

	@ApiProperty({ example: 'Engineering' })
	department: string;

	@ApiProperty({ enum: EmployeeRole, example: EmployeeRole.SENIOR })
	role: EmployeeRole;
}

export class WonPrizeResponseDto {
	@ApiProperty({ example: 1 })
	prizeId: number;

	@ApiProperty({ example: 'iPhone 15 Pro' })
	prizeName: string;

	@ApiProperty({ description: 'Prize rank in format "{level}-{sequence}"', example: '1-1' })
	rank: string;

	@ApiProperty({ description: 'Prize level display name', example: '特獎' })
	prizeLevel: string;

	@ApiProperty({ example: '2024-12-06T10:30:00.000Z' })
	drawnAt: string;
}

export class ParticipantStatusResponseDto {
	@ApiProperty({ type: ParticipantInfoResponseDto })
	participant: ParticipantInfoResponseDto;

	@ApiProperty({ type: [WonPrizeResponseDto] })
	wonPrizes: WonPrizeResponseDto[];
}

// ============================================================
// Create Raffle Response
// ============================================================

export class CreateRaffleResponseDto {
	@ApiProperty({ example: 1 })
	id: number;
}

// ============================================================
// Add Bonus Prize Response
// ============================================================

export class BonusPrizeEligibleCountsResponseDto {
	@ApiProperty({ enum: ['bonus'], example: 'bonus' })
	kind: 'bonus';

	@ApiProperty({ example: 3 })
	total: number;
}

export class BonusPrizeResponseDto {
	@ApiProperty({ example: 10 })
	id: number;

	@ApiProperty({ description: 'Prize rank in format "{level}-{sequence}"', example: '5-1' })
	rank: string;

	@ApiProperty({ example: 'Bonus AirPods' })
	name: string;

	@ApiProperty({ description: 'Prize level display name', example: '頭獎' })
	prizeLevel: string;

	@ApiProperty({ type: BonusPrizeEligibleCountsResponseDto })
	eligibleCounts: BonusPrizeEligibleCountsResponseDto;
}
