import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSeguimientoDto {
  @ApiProperty()
  @IsInt()
  postulacion_id: number;

  @ApiProperty({ example: 0 })
  @IsInt()
  @IsOptional()
  horas_cumplidas?: number;

  @ApiProperty({ example: 300 })
  @IsInt()
  @IsOptional()
  horas_totales?: number;

  @ApiProperty({ example: 'pendiente' })
  @IsString()
  @IsOptional()
  evaluacion?: string;
}