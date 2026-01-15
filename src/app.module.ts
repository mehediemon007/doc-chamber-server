import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { Patient } from './modules/patients/entities/patient.entity';
// import { Doctor } from './modules/doctors/entities/doctor.entity';
// import { Chamber } from './modules/chambers/entities/chamber.entity';
// import { Booking } from './modules/bookings/entities/booking.entity';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChambersModule } from './modules/chambers/chambers.module';
import { BookingsModule } from './modules/bookings/bookings.module';
// import { MedicalRecord } from './modules/patients/entities/medical-record.entity';
// import { User } from './modules/users/entities/user.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(), // Loads .env
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.NODE_ENV !== 'development'
          ? process.env.DATABASE_URL
          : 'postgres://postgres:emon1234@localhost:5433/doc_chamber_db',
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
      autoLoadEntities: true,
      // host: process.env.DB_HOST || 'localhost',
      // port: Number(process.env.DB_PORT) || 5432,
      // username: process.env.DB_USERNAME || 'postgres',
      // password: process.env.DB_PASSWORD || 'password',
      // database: process.env.DB_NAME || 'pulse_chamber_db',
      // entities: [Doctor, Patient, User, Chamber, Booking, MedicalRecord], // Add your entities here
      synchronize: true, // Auto-creates table structure (Dev only)
      dropSchema: true, // Drops schema on every app restart (Dev only)
      extra: {
        max: 10,
        connectionTimeoutMillis: 30000,
      },
    }),
    DoctorsModule,
    PatientsModule,
    AuthModule,
    ChambersModule,
    BookingsModule,
  ],
})
export class AppModule {}
