import { IsIn } from 'class-validator';

export class UpdateStatusDto {
	@IsIn(['READY', 'COMPLETED'])
	status: 'READY' | 'COMPLETED';
}
