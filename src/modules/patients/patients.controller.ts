import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { SignupDto } from './dto/signup.dto';

@Controller('patients') // This makes the URL: /patients
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('signup')
  @UsePipes(new ValidationPipe()) // Triggers the DTO validation
  async signup(@Body() signupDto: SignupDto) {
    return this.patientsService.signup(signupDto);
  }
}
