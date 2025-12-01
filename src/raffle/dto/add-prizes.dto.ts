import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsOptional, IsUrl, MaxLength, Min, ValidateNested } from 'class-validator';

export class PrizeConfigDto {
	/** Prize rank (draw order) */
	@IsInt()
	@Min(1)
	rank: number;

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

	/** Number of senior winners */
	@IsInt()
	@Min(0)
	senior: number;

	/** Number of junior winners */
	@IsInt()
	@Min(0)
	junior: number;

	/** Optional prize template ID */
	@IsOptional()
	@IsInt()
	prizeTemplateId?: number;
}

export class AddPrizesDto {
	/** List of prizes to add */
	@IsArray()
	@ArrayNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => PrizeConfigDto)
	prizes: PrizeConfigDto[];
}
