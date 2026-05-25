import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { EstadoTesis } from '@prisma/client';

export class AdminUpdateTesisDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  resumen?: string;

  @IsOptional()
  @IsInt()
  estudiante_id?: number;

  @IsOptional()
  @IsInt()
  asesor_principal_id?: number;

  @IsOptional()
  @IsEnum(EstadoTesis)
  estado?: EstadoTesis;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsDateString()
  fecha_inicio?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsDateString()
  fecha_recepcion_documentos?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsDateString()
  fecha_limite_sustentacion?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsDateString()
  fecha_sustentacion?: string | null;

  @IsOptional()
  @IsString()
  recibo_turnitin_url?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  similitud_turnitin?: number | null;
}
