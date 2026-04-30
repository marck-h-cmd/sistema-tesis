import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSeguimientoDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  informe_estudiante?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  informe_asesor?: string;

  @ApiProperty({ example: 'aprobado', required: false })
  @IsString()
  @IsOptional()
  evaluacion?: string;

  @ApiProperty({ example: '2024-08-31', required: false })
  @IsDateString()
  @IsOptional()
  fecha_evaluacion?: string;
}