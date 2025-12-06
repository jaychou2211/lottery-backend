export class PrizeResponseDto {
	id: number;

	name: string;

	/** Prize rank in format "{level}-{sequence}" */
	rank: string;

	/** Prize level display name (derived from rank) */
	prizeLevel: string;

	imageUrl: string;

	/** Number of senior winners */
	senior: number;

	/** Number of junior winners */
	junior: number;
}
