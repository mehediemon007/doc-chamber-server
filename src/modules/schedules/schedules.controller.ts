// src/schedules/schedules.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { UpdateBulkScheduleDto } from './dto/create-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('bulk')
  @UseGuards(JwtAuthGuard) // Only Admin/Staff can call this
  async updateBulk(@Body() dto: UpdateBulkScheduleDto) {
    return this.schedulesService.updateBulk(dto);
  }

  @Get('chamber/:chamberId')
  async getByChamber(@Param('chamberId') chamberId: string) {
    return this.schedulesService.getScheduleByChamber(chamberId);
  }

  @Get('doctor/:doctorId/chamber/:chamberId')
  async getDoctorSchedule(
    @Param('doctorId') doctorId: string,
    @Param('chamberId') chamberId: string,
  ) {
    return this.schedulesService.findSchedule(doctorId, chamberId);
  }
}
