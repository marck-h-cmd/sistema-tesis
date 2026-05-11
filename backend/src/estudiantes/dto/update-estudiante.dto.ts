import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PatchUsuarioEstudianteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombres?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apellidos?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefono?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dni?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateEstudianteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigo_universitario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  escuela_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchUsuarioEstudianteDto)
  usuario?: PatchUsuarioEstudianteDto;
}
