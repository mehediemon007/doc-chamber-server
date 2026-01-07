import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// 1. Define a local interface to tell TS what's inside the request
interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: RequestWithUser, // 2. Apply the interface here
  ) {
    // Now TS knows req.user.userId is a string!
    return this.bookingsService.create(createBookingDto, req.user.userId);
  }

  // src/modules/bookings/bookings.controller.ts

  @Get('queue/:chamberId')
  @UseGuards(JwtAuthGuard) // If you want to restrict this to Doctors
  async getQueue(@Param('chamberId') chamberId: string) {
    return this.bookingsService.getDailyQueue(chamberId);
  }
}
