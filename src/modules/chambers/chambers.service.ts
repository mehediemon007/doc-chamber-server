import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chamber } from './entities/chamber.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { CreateChamberDto } from './dto/create-chamber.dto';

@Injectable()
export class ChambersService {
  constructor(
    @InjectRepository(Chamber)
    private chamberRepository: Repository<Chamber>,
  ) {}

  async create(dto: CreateChamberDto): Promise<Chamber> {
    const { doctorId, ...chamberData } = dto;

    const chamber = this.chamberRepository.create({
      ...chamberData,
      doctor: { id: doctorId } as Doctor,
    });

    return await this.chamberRepository.save(chamber);
  }

  // The "Next Patient" Button Logic
  async callNextPatient(chamberId: string) {
    const chamber = await this.chamberRepository.findOne({
      where: { id: chamberId },
    });
    if (!chamber) throw new NotFoundException('Chamber not found');

    if (chamber.currentSerial < chamber.totalBooked) {
      chamber.currentSerial += 1;
      return await this.chamberRepository.save(chamber);
    }

    return { message: 'All booked patients have been seen!' };
  }

  // The "Relaxation" Toggle
  async toggleBookingStatus(chamberId: string) {
    const chamber = await this.chamberRepository.findOne({
      where: { id: chamberId },
    });
    if (!chamber) throw new NotFoundException('Chamber not found');

    chamber.isBookingOpen = !chamber.isBookingOpen;
    return await this.chamberRepository.save(chamber);
  }

  async findByDoctor(doctorId: string) {
    return await this.chamberRepository.find({
      where: { doctor: { id: doctorId } },
      order: { createdAt: 'DESC' },
    });
  }
}
