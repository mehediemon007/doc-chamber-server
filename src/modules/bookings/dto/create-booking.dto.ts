import { IsNotEmpty, IsUUID, IsDateString } from 'class-validator';

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
}
