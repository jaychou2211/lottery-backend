import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateRaffleDto {
	/** Raffle name */
	@IsNotEmpty()
	@MaxLength(100)
	name: string;
}
