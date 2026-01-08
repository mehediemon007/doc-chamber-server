import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Role } from '../enums/role.enum';

export class RegisterStaffDto {
  @IsNotEmpty()
  @IsString()
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
