import { IsInt, IsOptional, IsUrl, Matches, MaxLength, Min } from 'class-validator';

export class UpdatePrizeDto {
	/** Prize name */
	@IsOptional()
	@MaxLength(100)
	name?: string;

	/** Prize rank in format "{level}-{sequence}" (e.g., "1-1", "2-3", "5-1") */
	@IsOptional()
	@Matches(/^[1-5]-\d+$/, { message: 'rank must be in format "{level}-{sequence}" where level is 1-5' })
	@MaxLength(10)
	rank?: string;

	/** Prize image URL */
	@IsOptional()
	@IsUrl()
	@MaxLength(500)
	imageUrl?: string;

	/** Number of senior winners */
	@IsOptional()
	@IsInt()
	@Min(0)
	senior?: number;

	/** Number of junior winners */
	@IsOptional()
	@IsInt()
	@Min(0)
	junior?: number;
}
