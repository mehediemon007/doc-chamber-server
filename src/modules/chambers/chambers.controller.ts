import { Controller, Post, Body, Get, Patch, Param } from '@nestjs/common';
import { ChambersService } from './chambers.service';
import { CreateChamberDto } from './dto/create-chamber.dto';

@Controller('chambers')
export class ChambersController {
  constructor(private readonly chambersService: ChambersService) {}

  @Post()
  create(@Body() createChamberDto: CreateChamberDto) {
    return this.chambersService.create(createChamberDto);
  }

  @Get('doctor/:doctorId')
  getByDoctor(@Param('doctorId') doctorId: string) {
    return this.chambersService.findByDoctor(doctorId);
  }

  // Doctor clicks this to call the next patient
  @Patch(':id/next')
  nextPatient(@Param('id') id: string) {
    return this.chambersService.callNextPatient(id);
  }

  // Doctor clicks this to stop/start new bookings
  @Patch(':id/toggle')
  toggleStatus(@Param('id') id: string) {
    return this.chambersService.toggleBookingStatus(id);
  }
}
