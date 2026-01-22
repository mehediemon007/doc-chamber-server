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

export class RegisterPatientDto {
  @IsNotEmpty()
  @Matches(/^\+8801[3-9]\d{8}$/, {
    message:
      'Phone number must be a valid Bangladesh number starting with +880 (e.g., +88017XXXXXXXX)',
  })
  phone: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsOptional()
  @IsUUID()
  chamberId?: string;
}
