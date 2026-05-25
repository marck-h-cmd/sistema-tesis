import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubirArchivoPracticaDto {
  @ApiProperty({ description: 'URL del archivo ya subido a almacenamiento' })
  @IsString()
  archivo_url: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nombre_original?: string;
}
