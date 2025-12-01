import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class AddParticipantsDto {
	/** List of employee IDs to add as participants */
	@IsArray()
	@ArrayNotEmpty()
	@IsInt({ each: true })
	employeeIds: number[];
}
