import { IsString, IsNotEmpty, IsMobilePhone } from 'class-validator';

export class LoginDto {
  @IsMobilePhone()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
