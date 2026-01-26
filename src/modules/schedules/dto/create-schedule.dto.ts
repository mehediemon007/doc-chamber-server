import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShiftDto {
  @IsEnum(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
  dayOfWeek: string;

  @IsString()
  @IsNotEmpty()
  shiftName: string;

  @IsString()
  @IsNotEmpty()
  startTime: string; // "10:00"

  @IsString()
  @IsNotEmpty()
  endTime: string; // "13:00"
}

export class UpdateBulkScheduleDto {
  @IsUUID()
  doctorId: string;

  @IsUUID()
  chamberId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  schedules: ShiftDto[];
}
