import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { Role } from '../enums/role.enum';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(Role, { message: 'Role must be doctor, patient, or staff' })
  role: Role;
}
