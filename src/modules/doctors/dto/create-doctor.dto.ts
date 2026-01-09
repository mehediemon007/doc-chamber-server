import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsOptional()
  @MinLength(5, { message: 'BMDC Registration number is too short' })
  bmdcRegistration?: string;

  @IsString()
  @IsOptional()
  degree?: string;

  @IsString()
  @IsOptional()
  experience?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUUID()
  @IsOptional() // Allows creation without a user account
  userId?: string;
}
