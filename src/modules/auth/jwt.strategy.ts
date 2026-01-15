import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from './enums/role.enum';

interface JwtPayload {
  sub: string;
  phone: string;
  fullName: string;
  role: Role;
  chamberId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // FIX: use getOrThrow to ensure it's never undefined
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      phone: payload.phone,
      fullName: payload.fullName,
      role: payload.role,
      chamberId: payload.chamberId,
    };
  }
}
