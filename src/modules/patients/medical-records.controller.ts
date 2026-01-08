import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { DiskStorageOptions } from 'multer';
import { extname } from 'path';
import { Request as ExpressRequest } from 'express';

import { PatientsService } from './patients.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/* ============================
 * Types
 * ============================ */

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

interface RequestWithUser extends ExpressRequest {
  user: AuthenticatedUser;
}

/* ============================
 * Multer Storage Configuration
 * ============================ */

const multerDiskOptions: DiskStorageOptions = {
  destination: './uploads/medical-reports',

  filename(
    req: ExpressRequest,
    file: Express.Multer.File,
    callback: (error: NodeJS.ErrnoException | null, filename: string) => void,
  ): void {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExt = extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${fileExt}`;

    callback(null, filename);
  },
};

const storageConfig = diskStorage(multerDiskOptions);

/* ============================
 * Controller
 * ============================ */

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: storageConfig,

      fileFilter(
        req: ExpressRequest,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ): void {
        if (!/\.(jpg|jpeg|png|pdf)$/i.test(file.originalname)) {
          return callback(
            new BadRequestException('Only JPG, PNG, and PDF files are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async create(
    @Body() dto: CreateMedicalRecordDto,
    @Request() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    const { role: authorRole, userId: authorId } = req.user;

    const filePaths: string[] = files.map((file) => file.path);

    return this.patientsService.addMedicalRecord(
      {
        ...dto,
        reportFiles: filePaths,
      },
      authorRole,
      authorId,
    );
  }

  @Get(':patientId')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Param('patientId') patientId: string) {
    return this.patientsService.getPatientHistory(patientId);
  }
}
