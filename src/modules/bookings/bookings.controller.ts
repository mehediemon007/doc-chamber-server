import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import * as AuthInterfaces from '../auth/interfaces/request-with-user.interface';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * PATIENT/USER ACTION: Create a new booking.
   * Uses the logged-in user's ID to link the patient.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Req() req: AuthInterfaces.RequestWithUser,
  ) {
    // We pass both the userId (to identify the patient)
    // and the chamberId from the body (to identify where they are booking)
    return this.bookingsService.create(createBookingDto, req.user.userId);
  }

  /**
   * DOCTOR/STAFF ACTION: Get the daily queue for THEIR specific chamber.
   * This route is protected so Doctor A cannot see Doctor B's queue.
   */
  @Get('queue/:chamberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN, Role.STAFF)
  async getQueue(
    @Param('chamberId') chamberId: string,
    @Req() req: AuthInterfaces.RequestWithUser,
  ) {
    // SECURITY CHECK: Ensure the doctor is only looking at their own chamber
    if (req.user.role !== Role.ADMIN && req.user.chamberId !== chamberId) {
      throw new ForbiddenException(
        'You do not have access to this chamber’s queue',
      );
    }

    return this.bookingsService.getDailyQueue(chamberId);
  }

  /**
   * CONVENIENCE ROUTE: Get the queue for the current logged-in user's chamber
   */
  @Get('my-queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.STAFF, Role.ADMIN)
  async getMyQueue(@Req() req: AuthInterfaces.RequestWithUser) {
    if (!req.user.chamberId) {
      throw new ForbiddenException('User is not assigned to a chamber');
    }
    return this.bookingsService.getDailyQueue(req.user.chamberId);
  }
}
