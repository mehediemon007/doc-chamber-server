import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './modules/patients/patient.entity';

@Module({
  imports: [
    ConfigModule.forRoot(), // Loads .env
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'pulse_chamber_db',
      entities: [Patient], // Add your entities here
      synchronize: true, // Auto-creates table structure (Dev only)
    }),
  ],
})
export class AppModule {}
