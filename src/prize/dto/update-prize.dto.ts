import { IsOptional, IsUrl, MaxLength } from 'class-validator';

export class UpdatePrizeDto {
	/** Prize name */
	@IsOptional()
	@MaxLength(100)
	name?: string;

	/** Prize level (e.g., "特獎", "頭獎", "二獎") */
	@IsOptional()
	@MaxLength(50)
	prizeLevel?: string;

	/** Prize image URL */
	@IsOptional()
	@IsUrl()
	@MaxLength(500)
	imageUrl?: string;
}
