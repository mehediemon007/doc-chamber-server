import { IsString, IsNotEmpty, IsMobilePhone, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsMobilePhone() // Ensures it's a real phone number format
  phone: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}