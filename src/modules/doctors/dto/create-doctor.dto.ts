import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  specialty: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'BMDC Registration number is too short' })
  bmdcRegistration: string;
}
