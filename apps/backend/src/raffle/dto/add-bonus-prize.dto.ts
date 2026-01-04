import { IsInt, IsNotEmpty, MaxLength, Min } from 'class-validator';

export class AddBonusPrizeDto {
	/** Prize name */
	@IsNotEmpty()
	@MaxLength(100)
	name: string;

	/** Number of winners */
	@IsInt()
	@Min(1)
	total: number;
}
