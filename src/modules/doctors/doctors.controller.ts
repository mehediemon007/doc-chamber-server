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
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto'; // You'll need to create this DTO
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import * as AuthInterfaces from '../auth/interfaces/request-with-user.interface';

@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect everything in this controller
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  /**
   * Only Admin or Staff can manually create a doctor profile
   */
  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  create(
    @Body() createDoctorDto: CreateDoctorDto,
    @Req() req: AuthInterfaces.RequestWithUser,
  ) {
    // Force the doctor profile to belong to the creator's chamber
    return this.doctorsService.create({
      ...createDoctorDto,
      chamberId: req.user.chamberId,
    });
  }

  /**
   * Doctors can update their own profile info (bio, degree, etc.)
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.DOCTOR)
  async update(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @Req() req: AuthInterfaces.RequestWithUser,
  ) {
    // Security Check: A doctor can ONLY update their own ID
    if (req.user.role === Role.DOCTOR && req.user.userId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.doctorsService.update(id, updateDoctorDto);
  }

  /**
   * Get all doctors belonging to the logged-in user's chamber
   */
  @Get()
  findAll(@Req() req: AuthInterfaces.RequestWithUser) {
    const chamberId = req.user.chamberId;

    // Safety Check: If for some reason the user has no chamberId, stop here.
    if (!chamberId) {
      throw new ForbiddenException('You are not assigned to any chamber.');
    }

    // TypeScript now knows chamberId is definitely a 'string' here
    return this.doctorsService.findAllByChamber(chamberId);
  }
}
