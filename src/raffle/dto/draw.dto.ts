import { IsInt, Min } from 'class-validator';

export class DrawDto {
	/** Prize rank to draw */
	@IsInt()
	@Min(1)
	rank: number;
}
