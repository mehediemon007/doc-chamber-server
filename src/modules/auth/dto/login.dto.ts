import { IsString, IsNotEmpty } from 'class-validator';
import { IsEmailOrPhone } from '../decorators/is-email-or-phone.decorator';

export class LoginDto {
  @IsEmailOrPhone() // <--- Uses your custom logic
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
