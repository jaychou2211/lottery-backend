import { IsInt, IsNotEmpty, IsOptional, IsUrl, MaxLength, Min } from 'class-validator';

export class AddBonusPrizeDto {
	/** Prize name */
	@IsNotEmpty()
	@MaxLength(100)
	name: string;

	/** Prize level */
	@IsNotEmpty()
	@MaxLength(50)
	prizeLevel: string;

	/** Prize image URL */
	@IsUrl()
	@MaxLength(500)
	imageUrl: string;

	/** Number of winners */
	@IsInt()
	@Min(1)
	total: number;

	/** Optional prize template ID */
	@IsOptional()
	@IsInt()
	prizeTemplateId?: number;
}
