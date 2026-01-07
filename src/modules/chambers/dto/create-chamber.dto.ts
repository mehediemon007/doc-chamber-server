import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class CreateChamberDto {
  @IsString()
  @IsNotEmpty()
  location: string; // e.g., "Popular Diagnostic, Room 402"

  @IsString()
  @IsNotEmpty()
  startTime: string; // e.g., "05:00 PM"

  @IsNumber()
  @IsOptional()
  maxPatients: number; // Defaults to 50 if not provided

  @IsUUID()
  @IsNotEmpty()
  doctorId: string; // The ID of the doctor this chamber belongs to
}
