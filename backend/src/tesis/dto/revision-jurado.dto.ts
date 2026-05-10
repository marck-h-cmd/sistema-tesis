import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevisionJuradoObservacionesDto {
  @ApiProperty()
  @IsString()
  observaciones: string;

  @ApiProperty({
    required: false,
    description: 'Archivo adjunto con correcciones sugeridas',
  })
  @IsString()
  @IsOptional()
  archivo_correciones_url?: string;
}
