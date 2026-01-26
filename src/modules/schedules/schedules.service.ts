// src/schedules/schedules.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { UpdateBulkScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(DoctorSchedule)
    private scheduleRepo: Repository<DoctorSchedule>,
    private dataSource: DataSource,
  ) {}

  async updateBulk(dto: UpdateBulkScheduleDto) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Wipe old schedules for this doctor at this specific chamber
      await manager.delete(DoctorSchedule, {
        doctor: { id: dto.doctorId },
        chamber: { id: dto.chamberId },
      });

      // 2. Create new ones
      const newSchedules = dto.schedules.map((s) =>
        manager.create(DoctorSchedule, {
          ...s,
          doctor: { id: dto.doctorId },
          chamber: { id: dto.chamberId },
        }),
      );

      return await manager.save(DoctorSchedule, newSchedules);
    });
  }

  async getScheduleByChamber(chamberId: string) {
    return this.scheduleRepo.find({
      where: { chamber: { id: chamberId } },
      relations: ['doctor'],
      order: { startTime: 'ASC' },
    });
  }

  async findSchedule(doctorId: string, chamberId: string) {
    return await this.scheduleRepo.find({
      where: {
        doctor: { id: doctorId },
        chamber: { id: chamberId },
      },
      // We order by day and time so the frontend doesn't have to sort it
      order: {
        dayOfWeek: 'ASC',
        startTime: 'ASC',
      },
    });
  }
}
