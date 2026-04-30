import { IsString, IsInt, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTesisDto {
  @ApiProperty({ example: 'Sistema de Gestión de Prácticas Preprofesionales' })
  @IsString()
  titulo: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  resumen?: string;

  @ApiProperty()
  @IsInt()
  estudiante_id: number;

  @ApiProperty()
  @IsInt()
  asesor_principal_id: number;

  @ApiProperty({ example: '2024-03-01', required: false })
  @IsDateString()
  @IsOptional()
  fecha_inicio?: string;
  @ApiProperty({ example: '2024-03-18', required: false })
  @IsDateString()
  @IsOptional()
  fecha_sustentacion?: string;
}