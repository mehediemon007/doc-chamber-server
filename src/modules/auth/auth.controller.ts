import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UsePipes(new ValidationPipe()) // This validates the phone format before logic starts
  async login(@Body() loginDto: LoginDto) {
    // No more "any" errors!
    return this.authService.login(loginDto.phone, loginDto.password);
  }
}
