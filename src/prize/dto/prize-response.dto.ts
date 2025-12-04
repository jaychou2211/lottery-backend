export class PrizeResponseDto {
	id: number;

	name: string;

	prizeLevel: string;

	imageUrl: string;

	/** Number of senior winners */
	senior: number;

	/** Number of junior winners */
	junior: number;
}
