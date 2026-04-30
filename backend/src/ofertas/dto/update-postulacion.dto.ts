import { IsEnum, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoPostulacion } from '@prisma/client';

export class UpdatePostulacionDto {
  @ApiProperty({ enum: EstadoPostulacion, required: false })
  @IsEnum(EstadoPostulacion)
  @IsOptional()
  estado?: EstadoPostulacion;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  asesor_academico_id?: number;
}