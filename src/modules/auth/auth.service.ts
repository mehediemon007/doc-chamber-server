import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PatientsService } from '../patients/patients.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private patientsService: PatientsService,
    private jwtService: JwtService,
  ) {}

  async login(phone: string, pass: string) {
    // 1. Fetch patient by phone (including the password field)
    const patient = await this.patientsService.findOneByPhone(phone);

    // 2. Verify password
    if (!patient) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const isMatch = await bcrypt.compare(pass, patient.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    // 3. Generate Token
    const payload = { sub: patient.id, phone: patient.phone };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: patient.id,
        fullName: patient.fullName,
        phone: patient.phone,
      },
    };
  }
}
