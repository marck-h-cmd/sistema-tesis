import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConvenioDto {
  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  fecha_inicio: string;

  @ApiProperty({ example: '2025-12-31' })
  @IsDateString()
  fecha_fin: string;

  @ApiProperty({ example: 'marco' })
  @IsString()
  tipo: string;

  @ApiProperty({ example: 'https://example.com/convenio.pdf', required: false })
  @IsString()
  @IsOptional()
  archivo_pdf?: string;

  @ApiProperty({ example: 'vigente' })
  @IsString()
  estado: string;
}