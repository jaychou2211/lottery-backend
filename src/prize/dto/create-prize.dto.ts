import { IsInt, IsNotEmpty, IsUrl, Matches, MaxLength, Min } from 'class-validator';

export class CreatePrizeDto {
	/** Prize name */
	@IsNotEmpty()
	@MaxLength(100)
	name: string;

	/** Prize rank in format "{level}-{sequence}" (e.g., "1-1", "2-3", "5-1") */
	@IsNotEmpty()
	@Matches(/^[1-5]-\d+$/, { message: 'rank must be in format "{level}-{sequence}" where level is 1-5' })
	@MaxLength(10)
	rank: string;

	/** Prize image URL */
	@IsUrl()
	@MaxLength(500)
	imageUrl: string;

	/** Number of senior winners */
	@IsInt()
	@Min(0)
	senior: number;

	/** Number of junior winners */
	@IsInt()
	@Min(0)
	junior: number;
}
