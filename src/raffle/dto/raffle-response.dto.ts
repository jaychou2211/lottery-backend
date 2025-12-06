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

export class EligibleCountsResponseDto {
	@ApiProperty({ enum: ['regular', 'bonus'], example: 'regular' })
	kind: 'regular' | 'bonus';

	@ApiProperty({ example: 3 })
	total: number;

	@ApiPropertyOptional({ example: 2 })
	senior?: number;

	@ApiPropertyOptional({ example: 1 })
	junior?: number;
}

export class PrizeResponseDto {
	@ApiProperty({ example: 1 })
	id: number;

	@ApiProperty({ description: 'Prize rank in format "{level}-{sequence}"', example: '1-1' })
	rank: string;

	@ApiProperty({ example: 'iPhone 15 Pro' })
	name: string;

	@ApiProperty({ description: 'Prize level display name (derived from rank)', example: '特獎' })
	prizeLevel: string;

	@ApiProperty({ example: 'https://example.com/iphone.jpg' })
	imageUrl: string;

	@ApiProperty({ type: EligibleCountsResponseDto })
	eligibleCounts: EligibleCountsResponseDto;

	@ApiProperty({ example: false })
	isDrawn: boolean;

	@ApiPropertyOptional({ example: 1, nullable: true })
	prizeTemplateId: number | null;
}

export class WinnerResponseDto {
	@ApiProperty({ example: 1 })
	id: number;

	@ApiProperty({ example: 1 })
	rafflePrizeId: number;

	@ApiProperty({ example: 42 })
	participantId: number;

	@ApiProperty({ enum: DrawnGroup, example: DrawnGroup.SENIOR })
	drawnGroup: DrawnGroup;

	@ApiProperty({ example: '2024-12-06T10:30:00.000Z' })
	createdAt: string;
}

export class RaffleDetailResponseDto {
	@ApiProperty({ example: 1 })
	id: number;

	@ApiProperty({ example: '2024 Year-End Raffle' })
	name: string;

	@ApiProperty({ enum: RaffleStatus, example: RaffleStatus.IN_PROGRESS })
	status: RaffleStatus;

	@ApiPropertyOptional({ type: [ParticipantResponseDto] })
	participants?: ParticipantResponseDto[];

	@ApiPropertyOptional({ type: [PrizeResponseDto] })
	prizes?: PrizeResponseDto[];

	@ApiPropertyOptional({ type: [WinnerResponseDto] })
	winners?: WinnerResponseDto[];
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
