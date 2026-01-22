import {
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsString,
  IsDateString,
  Matches,
} from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  chamberId: string;

  /**
   * Must be in YYYY-MM-DD format.
   * Example: "2026-01-15"
   */
  @IsDateString()
  @IsNotEmpty()
  bookingDate: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @Matches(/^\+8801[3-9]\d{8}$/, {
    message:
      'Phone number must be a valid Bangladesh number starting with +880 (e.g., +88017XXXXXXXX)',
  })
  @IsString()
  phone?: string;
}
