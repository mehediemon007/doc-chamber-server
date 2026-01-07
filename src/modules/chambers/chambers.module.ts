import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChambersService } from './chambers.service';
import { ChambersController } from './chambers.controller';
import { Chamber } from './entities/chamber.entity';
import { Doctor } from '../doctors/entities/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chamber, Doctor])],
  controllers: [ChambersController],
  providers: [ChambersService],
  exports: [TypeOrmModule], // Export this so BookingsModule can see the Chamber repository
})
export class ChambersModule {}
