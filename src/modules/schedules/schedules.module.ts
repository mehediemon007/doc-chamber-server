// src/schedules/schedules.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { User } from '../users/entities/user.entity';
import { Chamber } from '../chambers/entities/chamber.entity'; // Import Chamber for relations

@Module({
  imports: [
    // Include all entities used in this module's logic
    TypeOrmModule.forFeature([DoctorSchedule, User, Chamber]),
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService], // Exported so BookingsModule can validate shifts
})
export class SchedulesModule {}
