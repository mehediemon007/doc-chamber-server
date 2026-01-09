import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import * as AuthInterfaces from '../auth/interfaces/request-with-user.interface';

@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  create(
    @Body() createDoctorDto: CreateDoctorDto,
    @Req() req: AuthInterfaces.RequestWithUser,
  ) {
    return this.doctorsService.create({
      ...createDoctorDto,
      chamberId: req.user.chamberId,
    });
  }

  @Patch(':id/link/:userId')
  @Roles(Role.ADMIN, Role.STAFF)
  linkAccount(
    @Param('id', ParseUUIDPipe) doctorId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.doctorsService.linkUserAccount(doctorId, userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF, Role.PATIENT)
  findAll(@Req() req: AuthInterfaces.RequestWithUser) {
    const chamberId = req.user.chamberId;
    if (!chamberId) {
      throw new ForbiddenException('You are not assigned to any chamber.');
    }

    const isPatient = req.user.role === Role.PATIENT;
    return this.doctorsService.findAllByChamber(chamberId, isPatient);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.DOCTOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @Req() req: AuthInterfaces.RequestWithUser,
  ) {
    // Security: Doctors can only update their own linked profile
    if (req.user.role === Role.DOCTOR) {
      const doctor = await this.doctorsService.findOne(id);
      if (doctor.user?.id !== req.user.userId) {
        throw new ForbiddenException('You can only update your own profile');
      }
    }
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.DOCTOR)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorsService.findOne(id);
  }
}
