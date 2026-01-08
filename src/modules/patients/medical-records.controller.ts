import {
  Controller,
  Post,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
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

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const storageConfig = diskStorage({
  destination: './uploads/medical-reports',

  filename(
    req: ExpressRequest,
    file: Express.Multer.File,
    callback: (error: NodeJS.ErrnoException | null, filename: string) => void,
  ): void {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const fileExt = extname(file.originalname);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const filename = `${file.fieldname}-${uniqueSuffix}${fileExt}`;

    callback(null, filename);
  },
} as any);

/* ============================
 * Controller
 * ============================ */

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    FilesInterceptor('files', 5, {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      storage: storageConfig,

      fileFilter(
        req: ExpressRequest,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ): void {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        if (!/\.(jpg|jpeg|png|pdf)$/i.test(file.originalname)) {
          return callback(
            new BadRequestException('Only JPG, PNG, and PDF files are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    } as any),
  )
  async create(
    @Body() dto: CreateMedicalRecordDto,
    @Request() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    const { role: authorRole, userId: authorId } = req.user;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    const filePaths: string[] = files.map((file: any) => file.path) as string[];

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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.patientsService.deleteMedicalRecord(id);
  }

  @Delete(':id/file/:fileName')
  @UseGuards(JwtAuthGuard)
  // 1. Remove @HttpCode(HttpStatus.NO_CONTENT) so we can send the JSON body
  // 2. Change Promise<void> to match the Service's return type
  async removeFile(
    @Param('id') id: string,
    @Param('fileName') fileName: string,
  ): Promise<{ message: string; updatedAt: Date; remainingFiles: number }> {
    return this.patientsService.deleteSpecificFile(id, fileName);
  }
}
