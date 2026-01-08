import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { Role } from './enums/role.enum';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterStaffDto } from './dto/register-staff.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import * as AuthInterfaces from './interfaces/request-with-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * SAAS ENTRY POINT: Doctor signs up to start their own chamber
   * The doctor becomes the ADMIN and a new Chamber is created.
   * Route: POST /auth/setup-chamber
   */
  @Post('setup-chamber')
  async setupChamber(@Body() dto: RegisterStaffDto) {
    return this.authService.registerOwner(dto);
  }

  /**
   * PUBLIC: Patient signup via a Doctor's specific landing page.
   * The 'chamberId' is passed in the DTO body from the landing page.
   * Route: POST /auth/signup
   */
  @Post('signup')
  async signup(@Body() dto: RegisterPatientDto) {
    return this.authService.register(dto, dto.role, dto.chamberId);
  }

  /**
   * PROTECTED: Admin (Owner) adds another Doctor or Staff to THEIR chamber.
   * The 'chamberId' is extracted from the Admin's JWT token via the Request.
   * Route: POST /auth/staff/signup/:role
   */
  @Post('staff/signup/:role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async registerStaff(
    @Param('role') role: Role,
    @Body() dto: RegisterStaffDto,
    @Req() req: AuthInterfaces.RequestWithUser,
  ) {
    if (role !== Role.DOCTOR && role !== Role.STAFF) {
      throw new BadRequestException('Invalid staff role provided in URL');
    }

    // Automatically links new staff to the same chamber as the logged-in Admin
    return this.authService.register(dto, role, req.user.chamberId);
  }

  /**
   * PUBLIC: Unified Login
   * Returns a JWT containing the chamberId for session isolation.
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.phone, loginDto.password);
  }
}
