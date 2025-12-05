import { Transform } from 'class-transformer';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateRaffleDto {
	@Transform(({ value }) => value || new Date().toLocaleString('sv'))
	@IsNotEmpty()
	@MaxLength(100)
	name: string;
}
