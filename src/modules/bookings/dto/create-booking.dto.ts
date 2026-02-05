import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsDateString,
  Matches,
} from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty({ message: 'Chamber ID is required' })
  chamberId: string;

  @IsUUID()
  @IsNotEmpty({ message: 'Please select a specific shift' })
  shiftId: string;

  /**
   * Must be in YYYY-MM-DD format.
   * Example: "2026-01-15"
   */
  @IsDateString()
  @IsNotEmpty({ message: 'Booking date is required' })
  bookingDate: string;

  @IsString()
  @IsNotEmpty({ message: 'Patient  name is required' })
  fullName: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+8801[3-9]\d{8}$/, {
    message:
      'Phone number must be a valid Bangladesh number starting with +880 (e.g., +88017XXXXXXXX)',
  })
  @IsString()
  phone: string;
}
