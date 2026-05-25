import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ValidarDocumentoPracticaDto {
  @IsBoolean()
  validado: boolean;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
