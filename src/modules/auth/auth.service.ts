import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { Chamber } from '../chambers/entities/chamber.entity';
import { Patient } from '../patients/entities/patient.entity';
import { SubscriptionToken } from './entities/subscription-token.entity';
import { Role } from './enums/role.enum';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterStaffDto } from './dto/register-staff.dto';

import { JwtPayload } from './interfaces/auth-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SubscriptionToken)
    private tokenRepository: Repository<SubscriptionToken>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  // Helper to generate a new token for a beta user
  async generateBetaToken(): Promise<string> {
    const newToken = `BETA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const tokenEntry = this.tokenRepository.create({
      tokenValue: newToken,
      isUsed: false,
    });

    await this.tokenRepository.save(tokenEntry);
    return newToken;
  }

  /**
   * UNIFIED LOGIN
   */
  async login(identifier: string, pass: string) {
    const user = await this.usersRepository.findOne({
      where: { phone: identifier },
      select: ['id', 'fullName', 'phone', 'password', 'role'],
      relations: ['chamber'],
    });

    if (!user) {
      throw new BadRequestException({
        errorMessage: {
          phone: 'No account found with this phone number.',
        },
        error: 'Not Found',
        statusCode: 400,
      });
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new BadRequestException({
        errorMessage: {
          password: 'Incorrect password, Try again.',
        },
        error: 'Unauthorized',
        statusCode: 400,
      });
    }

    const payload = {
      sub: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      chamberId: user.chamber?.id,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
  /**
   * REFRESH TOKEN logic for NextAuth callback
   */
  async refreshTokens(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );

      // Fetch the user to get the latest data (role, fullName, etc.)
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
        relations: ['chamber'],
      });

      if (!user) throw new UnauthorizedException();

      const newPayload = {
        sub: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        chamberId: user.chamber?.id,
      };

      return {
        accessToken: await this.jwtService.signAsync(newPayload, {
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: '15m',
        }),
        refreshToken: await this.jwtService.signAsync(newPayload, {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '7d',
        }),
      };
    } catch {
      throw new UnauthorizedException('Invalid Refresh Token');
    }
  }

  /**
   * SAAS ENTRY POINT: Register Owner + Create Chamber
   */
  async registerOwner(dto: RegisterStaffDto) {
    const { phone, password, subscriptionToken, chamberName, licenseNumber } =
      dto;

    // 1. Pre-check: Does user already exist? (Save resources)
    const existingUser = await this.usersRepository.findOne({
      where: { phone },
    });
    if (existingUser)
      throw new BadRequestException('User with this phone already exists');

    // 2. Hash password before transaction (Keep transaction fast)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Start the Transaction
    return await this.dataSource.transaction(async (manager) => {
      // A. Verify & Lock the token inside the transaction
      const tokenRecord = await manager.findOne(SubscriptionToken, {
        where: { tokenValue: subscriptionToken, isUsed: false },
        lock: { mode: 'pessimistic_write' }, // Prevents two people using same token at exact same time
      });

      if (!tokenRecord) {
        throw new ForbiddenException('Invalid or expired beta token.');
      }

      // B. Create the Chamber
      const name = chamberName || `${phone}'s Chamber`;
      const chamber = manager.create(Chamber, { name });
      const savedChamber = await manager.save(chamber);

      // C. Create the User (Admin)
      const newUser = manager.create(User, {
        phone,
        password: hashedPassword,
        role: Role.ADMIN,
        fullName: dto.fullName, // Don't forget fullName!
        licenseNumber,
        chamber: savedChamber,
      });
      const savedUser = await manager.save(newUser);

      // D. CRITICAL: Mark token as used within the same transaction
      tokenRecord.isUsed = true;
      tokenRecord.usedByPhone = phone;
      await manager.save(tokenRecord);

      // Return successful response
      return {
        ...savedUser,
        message: 'Chamber and Admin account created successfully',
        password: undefined,
        chamberId: savedChamber.id,
      };
    });
  }

  /**
   * UPDATED GENERAL REGISTRATION
   * Handles creating the Auth User and the Patient Profile in one transaction.
   */
  // auth.service.ts

  async register(
    dto: RegisterPatientDto | RegisterStaffDto,
    role: Role,
    chamberId?: string,
  ) {
    const { phone, password, fullName } = dto;

    // 1. Specific Check for existing user
    const existingUser = await this.usersRepository.findOne({
      where: { phone },
    });

    if (existingUser) {
      throw new BadRequestException({
        errorMessage: {
          phone: 'This phone number is already used.',
        },
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    // 2. Password Length Check (Extra safety if DTO misses it)
    if (password.length < 6) {
      throw new BadRequestException({
        errorMessage: {
          password: 'Password is too short. Minimum 6 characters required.',
        },
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.dataSource.transaction(async (manager) => {
      try {
        const shadowPatient = await manager.findOne(Patient, {
          where: { phone },
        });

        const newUser = manager.create(User, {
          phone,
          password: hashedPassword,
          fullName,
          role,
          chamber: chamberId ? ({ id: chamberId } as Chamber) : undefined,
        });

        const savedUser = await manager.save(newUser);

        if (role === Role.PATIENT) {
          if (shadowPatient) {
            shadowPatient.user = savedUser;
            shadowPatient.fullName = fullName;
            await manager.save(Patient, shadowPatient);
          } else {
            const newPatient = manager.create(Patient, {
              phone: savedUser.phone,
              fullName: savedUser.fullName,
              user: savedUser,
            });
            await manager.save(Patient, newPatient);
          }
        }

        // SUCCESS MESSAGE STRUCTURE
        return {
          success: true,
          message: 'Account created successfully!',
          user: {
            id: savedUser.id,
            phone: savedUser.phone,
            fullName: savedUser.fullName,
            role: savedUser.role,
          },
        };
      } catch (err) {
        console.error('Registration Error:', err);

        throw new BadRequestException({
          errorMessage: {
            system:
              'Something went wrong during registration. Please try again.',
          },
          error: 'Bad Request',
          statusCode: 400,
        });
      }
    });
  }
}
