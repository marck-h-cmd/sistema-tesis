import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ValidarDocumentoTesisDto {
  @IsBoolean()
  validado: boolean;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
