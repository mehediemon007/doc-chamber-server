import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PatientsModule } from '../patients/patients.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PatientsModule, // To find the patient in the DB
    PassportModule,
    JwtModule.register({
      secret: 'MY_SECRET_KEY_123', // In production, use .env
      signOptions: { expiresIn: '7d' }, // Patient stays logged in for 7 days
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
