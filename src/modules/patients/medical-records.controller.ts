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
import { memoryStorage } from 'multer'; // Use memory, not disk
import { Request as ExpressRequest } from 'express';
import { PatientsService } from './patients.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupabaseStorageService } from '../common/supabase-storage.service'; // You'll create this

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

interface RequestWithUser extends ExpressRequest {
  user: AuthenticatedUser;
}

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly supabaseStorage: SupabaseStorageService, // Inject Supabase helper
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: memoryStorage(), // Fixed: No more './uploads' folder
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

    // Upload each file to Supabase and get the Public URLs
    const uploadPromises = files.map((file) =>
      this.supabaseStorage.uploadFile(file, 'medical-reports'),
    );

    const filePublicUrls = await Promise.all(uploadPromises);

    return this.patientsService.addMedicalRecord(
      {
        ...dto,
        reportFiles: filePublicUrls, // Save URLs in DB instead of local paths
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
  async removeFile(
    @Param('id') id: string,
    @Param('fileName') fileName: string,
  ): Promise<{ message: string; updatedAt: Date; remainingFiles: number }> {
    return this.patientsService.deleteSpecificFile(id, fileName);
  }
}
