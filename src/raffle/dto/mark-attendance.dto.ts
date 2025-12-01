import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, ValidateNested } from 'class-validator';

export class AttendanceRecordDto {
	@IsInt()
	employeeId: number;

	@IsBoolean()
	attended: boolean;
}

export class MarkAttendanceDto {
	/** List of attendance records */
	@IsArray()
	@ArrayNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => AttendanceRecordDto)
	records: AttendanceRecordDto[];
}
