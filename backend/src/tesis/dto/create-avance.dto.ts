import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvanceDto {
  @ApiProperty({ example: 'capitulo' })
  @IsString()
  tipo: string;

  @ApiProperty()
  @IsString()
  descripcion: string;

  @ApiProperty({ example: '2024-06-15' })
  @IsDateString()
  fecha_entrega: string;

  @ApiProperty({ example: 'entregado', required: false })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}