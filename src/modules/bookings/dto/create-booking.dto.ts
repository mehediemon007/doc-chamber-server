import { IsNotEmpty, IsUUID, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  chamberId: string;

  @IsDateString()
  @IsNotEmpty()
  bookingDate: string; // Format: "2026-01-07"
}
