import { IsInt, IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOfertaDto {
  @ApiProperty()
  @IsInt()
  empresa_id: number;

  @ApiProperty({ example: 'Práctica en Desarrollo Web' })
  @IsString()
  titulo: string;

  @ApiProperty()
  @IsString()
  descripcion: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  requisitos?: string;

  @ApiProperty({ example: '2024-03-01' })
  @IsDateString()
  fecha_inicio: string;

  @ApiProperty({ example: '2024-08-31' })
  @IsDateString()
  fecha_fin: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  vacantes: number;

  @ApiProperty({ example: 'presencial' })
  @IsString()
  modalidad: string;
}