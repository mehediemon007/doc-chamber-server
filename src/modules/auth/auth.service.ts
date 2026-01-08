import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { Chamber } from '../chambers/entities/chamber.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Role } from './enums/role.enum';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterStaffDto } from './dto/register-staff.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  /**
   * UNIFIED LOGIN
   */
  async login(phone: string, pass: string) {
    const user = await this.usersRepository.findOne({
      where: { phone },
      select: ['id', 'phone', 'password', 'role'],
      relations: ['chamber'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      chamberId: user.chamber?.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        chamberId: user.chamber?.id,
      },
    };
  }

  /**
   * SAAS ENTRY POINT: Register Owner + Create Chamber
   */
  async registerOwner(dto: RegisterStaffDto) {
    const { phone, password } = dto;

    const existingUser = await this.usersRepository.findOne({
      where: { phone },
    });
    if (existingUser) throw new BadRequestException('User exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.dataSource.transaction(async (manager) => {
      const name: string = dto.chamberName || `${dto.phone}'s Chamber`;

      const chamber = manager.create(Chamber, { name });
      const savedChamber = await manager.save(chamber);

      const newUser = manager.create(User, {
        phone,
        password: hashedPassword,
        role: Role.ADMIN,
        licenseNumber: dto.licenseNumber,
        chamber: savedChamber,
      });

      const savedUser = await manager.save(newUser);
      return { ...savedUser, password: undefined, chamberId: savedChamber.id };
    });
  }

  /**
   * UPDATED GENERAL REGISTRATION
   * Handles creating the Auth User and the Patient Profile in one transaction.
   */
  async register(
    dto: RegisterPatientDto | RegisterStaffDto,
    role: Role,
    chamberId?: string,
  ) {
    const { phone, password } = dto;

    const existingUser = await this.usersRepository.findOne({
      where: { phone },
    });
    if (existingUser) throw new BadRequestException('User exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.dataSource.transaction(async (manager) => {
      // 1. Prepare and Save the User (Auth record)
      const userData: Partial<User> = {
        phone,
        password: hashedPassword,
        role,
        chamber: chamberId ? ({ id: chamberId } as Chamber) : undefined,
      };

      if ('licenseNumber' in dto) {
        userData.licenseNumber = dto.licenseNumber;
      }

      const newUser = manager.create(User, userData);
      const savedUser = await manager.save(newUser);

      // 2. Create the Patient Profile record (Only if role is Patient)
      if (role === Role.PATIENT) {
        // We cast the dto safely to access patient-specific fields
        const patientDto = dto as RegisterPatientDto;

        // Construct record manually to ensure no unwanted fields (like password) are passed
        const patientRecord = {
          id: savedUser.id, // Shared UUID with User table
          phone: savedUser.phone,
          fullName: patientDto.fullName || 'Unnamed Patient',
        };

        const newPatient = manager.create(Patient, patientRecord);
        await manager.save(Patient, newPatient);
      }

      return { ...savedUser, password: undefined };
    });
  }
}
