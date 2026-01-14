import {
  Controller,
  Post,
  Headers,
  Body,
  UseGuards,
  Param,
  BadRequestException,
  ForbiddenException,
  Req,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('generate-beta-token') // This adds /generate-beta-token to the path
  async generateToken(@Headers('x-admin-secret') secret: string) {
    const adminSecret = this.configService.get<string>(
      'SUPER_ADMIN_SECRET_KEY',
    );

    // For local testing if you haven't set the env yet:
    // if (secret !== 'test_secret') ...

    if (!secret || secret !== adminSecret) {
      throw new UnauthorizedException('Invalid admin secret');
    }
    return this.authService.generateBetaToken();
  }

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
   * PROTECTED: Admin OR Staff (Manager) adds another Doctor or Staff.
   * Both Roles can now access this, but only for their OWN chamber.
   */
  @Post('staff/signup/:role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF) // <--- Added Staff here
  async registerStaff(
    @Param('role') role: Role,
    @Body() dto: RegisterStaffDto,
    @Req() req: AuthInterfaces.RequestWithUser,
  ) {
    // 1. Validation: Prevent staff from creating an Admin
    if (role === Role.ADMIN) {
      throw new ForbiddenException(
        'Staff members cannot create Admin accounts',
      );
    }

    if (role !== Role.DOCTOR && role !== Role.STAFF) {
      throw new BadRequestException('Invalid staff role provided in URL');
    }

    // 2. Security: Ensure the creator has a chamberId
    if (!req.user.chamberId) {
      throw new ForbiddenException(
        'You must be assigned to a chamber to add staff',
      );
    }

    // 3. Logic: Passes the creator's chamberId so the new doctor is "locked" to this clinic
    return this.authService.register(dto, role, req.user.chamberId);
  }

  /**
   * PUBLIC: Unified Login
   * Returns a JWT containing the chamberId for session isolation.
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.identifier, loginDto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }
}
