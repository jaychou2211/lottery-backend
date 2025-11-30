import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsEmail,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsOptional,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from 'class-validator';

// =====================================================
// Demo Enum
// =====================================================
export enum DemoEnum {
	OPTION_A = 'option_a',
	OPTION_B = 'option_b',
}

// =====================================================
// Demo Nested DTO
// =====================================================
export class DemoNestedDto {
	@IsNotEmpty()
	field1: string;

	@IsNotEmpty()
	field2: string;
}

// =====================================================
// Demo Request DTO
// Showcases: JSDoc + class-validator + nested
// =====================================================
export class DemoRequestDto {
	/** Email field */
	@IsEmail()
	@IsNotEmpty()
	email: string;

	/** String with length constraint, 2-50 */
	@MinLength(2)
	@MaxLength(50)
	@IsNotEmpty()
	name: string;

	/** Integer with range, 0-100 */
	@IsInt()
	@Min(0)
	@Max(100)
	score: number;

	@IsEnum(DemoEnum)
	type: DemoEnum;

	@ValidateNested()
	@Type(() => DemoNestedDto)
	nested: DemoNestedDto;

	@IsOptional()
	@MaxLength(200)
	optional?: string;
}

// =====================================================
// Demo Response DTO
// =====================================================
export class DemoResponseDto {
	id: number;
	attr1: string;

	@ApiProperty({ type: String, nullable: true })
	attr2: string | null;

	/** ISO 8601 */
	createdAt: string;
}

// =====================================================
// Demo oneOf (union types)
// =====================================================
export class DemoSuccessDto {
	@ApiProperty({ enum: [true] })
	ok: true;

	data: DemoResponseDto;
}

export class DemoErrorDto {
	@ApiProperty({ enum: [false] })
	ok: false;

	code: string;
	message: string;
}

export class DemoResultDto {
	@ApiProperty({
		oneOf: [
			{ $ref: getSchemaPath(DemoSuccessDto) },
			{ $ref: getSchemaPath(DemoErrorDto) },
		],
	})
	result: DemoSuccessDto | DemoErrorDto;
}

// =====================================================
// Demo Exception DTO
// =====================================================
export class DemoExceptionDto {
	statusCode: number;
	message: string;
	error: string;
}
