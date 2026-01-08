import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Role } from './enums/role.enum';

// 1. Update the interface to include chamberId
interface JwtPayload {
  sub: string;
  phone: string; // Using phone since your login uses phone, not email
  role: Role;
  chamberId: string; // Required for SaaS isolation
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SUPER_SECRET_KEY', // Ensure this matches your AuthService
    });
  }

  // 2. The return value of validate() is what gets attached to req.user
  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      phone: payload.phone,
      role: payload.role,
      chamberId: payload.chamberId,
    };
  }
}
