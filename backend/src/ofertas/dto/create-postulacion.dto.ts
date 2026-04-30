import { IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostulacionDto {
  @ApiProperty()
  @IsInt()
  oferta_id: number;

  @ApiProperty()
  @IsInt()
  estudiante_id: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  asesor_academico_id?: number;
}