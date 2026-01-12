import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import this
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

// Import the entities used in AuthService
import { User } from '../users/entities/user.entity';
import { Chamber } from '../users/entities/chamber.entity';
import { SubscriptionToken } from './entities/subscription-token.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // 1. Register entities for this module to fix "UserRepository" dependency error
    TypeOrmModule.forFeature([User, Chamber, SubscriptionToken]),
    ConfigModule,
    PassportModule,
    JwtModule.register({
      secret: 'SUPER_SECRET_KEY', // Recommended: use process.env.JWT_SECRET
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
