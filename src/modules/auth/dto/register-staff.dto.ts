import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { Role } from '../enums/role.enum';

export class RegisterStaffDto {
  @IsNotEmpty()
  @Matches(/^\+8801[3-9]\d{8}$/, {
    message:
      'Phone number must be a valid Bangladesh number starting with +880 (e.g., +88017XXXXXXXX)',
  })
  phone: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  // Add these to fix the "should not exist" errors:
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsOptional() // Optional here because staff registration won't need it
  @IsString()
  subscriptionToken?: string;

  @IsOptional()
  @IsUUID()
  chamberId?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  chamberName?: string;
}
