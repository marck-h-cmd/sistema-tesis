import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ValidarReporteMensualDto {
  @IsBoolean()
  validado: boolean;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

