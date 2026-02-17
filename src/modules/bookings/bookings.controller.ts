import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { TenantId } from 'src/common/decorators.ts/tenant-id.decorator';
import * as AuthInterfaces from '../auth/interfaces/request-with-user.interface';

@Controller('chamber/:chamberSlug/bookings') // Pro Pattern: Slug-based routing
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * PATIENT ACTION: Create a booking in a specific chamber.
   * The tenantId is automatically resolved from the :chamberSlug by middleware.
   */
  @Post()
  async create(
    @TenantId() tenantId: string,
    @Body() createBookingDto: CreateBookingDto,
    @Req() req: AuthInterfaces.RequestWithOptionalUser,
  ) {
    const userId = req.user?.userId;
    // We pass the resolved UUID (tenantId) to the service, not the slug string
    return this.bookingsService.create(createBookingDto, tenantId, userId);
  }

  /**
   * STAFF/DOCTOR ACTION: Get the daily queue.
   * Cross-checks the URL context against the User's JWT data.
   */
  @Get('queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN, Role.STAFF)
  async getQueue(
    @TenantId() tenantId: string,
    @Req() req: AuthInterfaces.RequestWithUser,
  ) {
    // SUPER PRO SECURITY:
    // Prevent Doctor A from viewing Doctor B's queue by simply changing the URL slug.
    if (req.user.role !== Role.ADMIN && req.user.chamberId !== tenantId) {
      throw new ForbiddenException('Access Denied: This is not your chamber.');
    }

    return this.bookingsService.getDailyQueue(tenantId);
  }

  /**
   * PATIENT DASHBOARD ACTION: Get my bookings for this specific chamber.
   */
  // @Get('my-bookings')
  // @UseGuards(JwtAuthGuard)
  // async getMyBookings(
  //   @TenantId() tenantId: string,
  //   @Req() req: AuthInterfaces.RequestWithUser,
  // ) {
  //   return this.bookingsService.findPatientBookings(req.user.userId, tenantId);
  // }
}
