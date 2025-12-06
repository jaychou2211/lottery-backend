import { ApiProperty } from '@nestjs/swagger';

import { RaffleStatus, EmployeeRole, DrawnGroup } from '../../domain/shared';

export class ParticipantResponseDto {
	id: number;
	employeeId: number;
	staffNumber: string;
	name: string;
	department: string;

	@ApiProperty({ enum: EmployeeRole })
	role: EmployeeRole;

	tags: string[];
}

export class EligibleCountsResponseDto {
	kind: 'regular' | 'bonus';
	total: number;
	senior?: number;
	junior?: number;
}

export class PrizeResponseDto {
	id: number;
	/** Prize rank in format "{level}-{sequence}" */
	rank: string;
	name: string;
	/** Prize level display name (derived from rank) */
	prizeLevel: string;
	imageUrl: string;
	eligibleCounts: EligibleCountsResponseDto;
	isDrawn: boolean;
	prizeTemplateId: number | null;
}

export class WinnerResponseDto {
	id: number;
	rafflePrizeId: number;
	participantId: number;

	@ApiProperty({ enum: DrawnGroup })
	drawnGroup: DrawnGroup;

	createdAt: string;
}

export class RaffleResponseDto {
	id: number;
	name: string;

	@ApiProperty({ enum: RaffleStatus })
	status: RaffleStatus;

	participants: ParticipantResponseDto[];
	prizes: PrizeResponseDto[];
	winners: WinnerResponseDto[];
}

export class RaffleSummaryDto {
	id: number;
	name: string;

	@ApiProperty({ enum: RaffleStatus })
	status: RaffleStatus;

	participantCount: number;
	prizeCount: number;
	winnerCount: number;
}

export class DrawWinnerDto {
	participantId: number;
	staffNumber: string;
	name: string;
	department: string;

	@ApiProperty({ enum: EmployeeRole })
	role: EmployeeRole;

	@ApiProperty({ enum: DrawnGroup })
	drawnGroup: DrawnGroup;
}

export class DrawResponseDto {
	/** Prize rank in format "{level}-{sequence}" */
	rank: string;
	prize: {
		name: string;
		/** Prize level display name (derived from rank) */
		prizeLevel: string;
		imageUrl: string;
	};
	winners: DrawWinnerDto[];

	@ApiProperty({ enum: RaffleStatus })
	status: RaffleStatus;
}

export class BonusPrizeResponseDto {
	id: number;
	/** Prize rank in format "{level}-{sequence}" */
	rank: string;
	name: string;
	/** Prize level display name (derived from rank) */
	prizeLevel: string;
	imageUrl: string;
	eligibleCounts: { kind: 'bonus'; total: number };
}
