import { IsNotEmpty, IsUrl, MaxLength } from 'class-validator';

export class CreatePrizeDto {
	/** Prize name */
	@IsNotEmpty()
	@MaxLength(100)
	name: string;

	/** Prize level (e.g., "特獎", "頭獎", "二獎") */
	@IsNotEmpty()
	@MaxLength(50)
	prizeLevel: string;

	/** Prize image URL */
	@IsUrl()
	@MaxLength(500)
	imageUrl: string;
}
