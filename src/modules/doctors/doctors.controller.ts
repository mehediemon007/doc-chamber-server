import {
  Controller,
  Post,
  Headers,
  Body,
  Get,
  Patch,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  ParseUUIDPipe,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { interval, Observable, switchMap } from 'rxjs';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import * as AuthInterfaces from '../auth/interfaces/request-with-user.interface';
import { DoctorTravelStatus } from '../chambers/entities/chamber.entity';

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

  /**
   * REST Endpoint: Doctor App updates GPS location
   */
  @Patch(':id/location')
  @Roles(Role.DOCTOR)
  async updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { lat: number; lng: number; isHeading: boolean },
    @Req() req: AuthInterfaces.RequestWithUser,
  ) {
    const doctor = await this.doctorsService.findOne(id);
    if (doctor.user?.id !== req.user.userId) {
      throw new ForbiddenException('Unauthorized location update.');
    }

    // 1. Update coordinates in DB
    await this.doctorsService.updateLiveLocation(
      id,
      body.lat,
      body.lng,
      body.isHeading,
    );

    // 2. AUTO-ARRIVAL CHECK
    const targetChamber = doctor.chambers?.[0]; // In a real app, track the active journey chamber
    if (body.isHeading && targetChamber?.lat) {
      const distance = this.doctorsService.calculateDistance(
        body.lat,
        body.lng,
        Number(targetChamber.lat),
        Number(targetChamber.lng),
      );

      // If less than 200 meters away
      if (distance < 0.2) {
        await this.doctorsService.handleArrival(id, targetChamber.id);
      }
    }

    return { success: true };
  }

  /**
   * REST Endpoint: Doctor triggers the journey start
   */
  @Patch(':id/start-journey/:chamberId')
  @Roles(Role.DOCTOR)
  async startJourney(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('chamberId', ParseUUIDPipe) chamberId: string,
    @Req() req: AuthInterfaces.RequestWithUser,
  ) {
    const doctor = await this.doctorsService.findOne(id);
    if (doctor.user?.id !== req.user.userId) {
      throw new ForbiddenException(
        'You cannot start a journey for another doctor.',
      );
    }

    return this.doctorsService.startJourney(id, chamberId);
  }

  @Patch(':id/end-session/:chamberId')
  @Roles(Role.DOCTOR, Role.STAFF)
  async endSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('chamberId', ParseUUIDPipe) chamberId: string,
    @Req() req: AuthInterfaces.RequestWithUser,
  ) {
    // Security check: Only the doctor or their assigned staff can end the session
    const doctor = await this.doctorsService.findOne(id);
    if (req.user.role === Role.DOCTOR && doctor.user?.id !== req.user.userId) {
      throw new ForbiddenException(
        'You cannot end a session for another doctor.',
      );
    }

    await this.doctorsService.endSession(id, chamberId);
    return { message: 'Session ended and queue reset successfully.' };
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

  /**
   * SSE Endpoint: Patients stream live status
   */
  @Sse(':id/live-tracking')
  @Roles(Role.PATIENT, Role.STAFF, Role.ADMIN)
  streamDoctorLocation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Observable<MessageEvent> {
    return interval(30000).pipe(
      switchMap(async () => {
        const doctor = await this.doctorsService.findOne(id);
        const targetChamber = doctor.chambers?.[0];

        let distanceKm: number | null = null;
        let status = 'Offline';
        let eta = null;

        // 1. Extract values safely
        const delay = targetChamber?.delayMinutes || 0;
        const currentSerial = targetChamber?.currentSerial || 0;
        const totalBooked = targetChamber?.totalBooked || 0;

        // 2. Location & Status Logic
        if (
          doctor.isHeadingToChamber &&
          doctor.currentLat &&
          targetChamber?.lat
        ) {
          distanceKm = this.doctorsService.calculateDistance(
            Number(doctor.currentLat),
            Number(doctor.currentLng),
            Number(targetChamber.lat),
            Number(targetChamber.lng),
          );

          if (distanceKm < 0.2) {
            status = 'Arrived at Chamber';
            eta = '0 mins';
          } else {
            const baseTravelTime = Math.round(distanceKm * 3); // 3 mins per km
            const totalEtaMinutes = baseTravelTime + delay;

            status =
              delay > 0
                ? `Delayed Journey (${distanceKm} km away)`
                : `On the way (${distanceKm} km away)`;
            eta = `${totalEtaMinutes} mins`;
          }
        } else if (doctor.isHeadingToChamber) {
          status = 'Journey started...';
        }
        // FIX: Using the Enum here solves the "shared enum type" error
        else if (
          targetChamber?.travelStatus === DoctorTravelStatus.IN_CHAMBER
        ) {
          status = 'Doctor is in Chamber';
        }

        // 3. Return the payload
        return {
          data: {
            doctorName: doctor.name,
            status: status,
            location: {
              lat: doctor.currentLat,
              lng: doctor.currentLng,
            },
            distanceToChamber: distanceKm ? `${distanceKm} km` : null,
            eta: eta,
            delayMinutes: delay,
            currentSerial: currentSerial,
            totalBooked: totalBooked,
            remainingPatients: totalBooked - currentSerial,
            lastSeenAt: doctor.lastLocationUpdate,
          },
        } as MessageEvent;
      }),
    );
  }

  @Patch('chamber/:chamberId/delay')
  @Roles(Role.DOCTOR, Role.STAFF)
  async reportDelay(
    @Param('chamberId', ParseUUIDPipe) chamberId: string,
    @Body('minutes') minutes: number,
  ) {
    await this.doctorsService.reportDelay(chamberId, minutes);
    return { message: `Delay of ${minutes} minutes reported to patients.` };
  }

  @Patch('chamber/:chamberId/next-patient')
  @Roles(Role.DOCTOR, Role.STAFF)
  async nextPatient(@Param('chamberId', ParseUUIDPipe) chamberId: string) {
    const nextSerial = await this.doctorsService.callNextPatient(chamberId);
    return {
      message: `Calling Serial #${nextSerial}`,
      currentSerial: nextSerial,
    };
  }

  // Add to DoctorsController
  @Patch('system/midnight-reset')
  @Roles(Role.ADMIN, Role.STAFF, Role.PATIENT) // Keep it restricted
  async triggerMidnightReset(@Headers('Authorization') authHeader: string) {
    // 1. Security check: Ensure the caller is Vercel Cron
    // In Vercel, CRON_SECRET is automatically compared if you use their recommended setup
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      throw new ForbiddenException('Only system cron can trigger this.');
    }

    await this.doctorsService.handleMidnightReset();
    return { message: 'Midnight reset triggered successfully.' };
  }
}
