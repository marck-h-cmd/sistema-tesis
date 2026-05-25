import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { EstadoPractica } from '@prisma/client';

export class UpdatePracticaAdminDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  horas_totales?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  horas_cumplidas?: number;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin_estimada?: string;

  @IsOptional()
  @IsEnum(EstadoPractica)
  estado?: EstadoPractica;

  @IsOptional()
  @IsInt()
  asesor_id?: number | null;
}
