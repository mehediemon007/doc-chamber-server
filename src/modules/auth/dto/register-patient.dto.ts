import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsUUID,
  IsMobilePhone,
} from 'class-validator';
import { Role } from '../enums/role.enum';

export class RegisterPatientDto {
  @IsNotEmpty()
  @IsMobilePhone('bn-BD')
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
