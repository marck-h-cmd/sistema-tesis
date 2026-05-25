import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoDocumentoTesis } from '@prisma/client';

export class SubirDocumentoTesisDto {
  @ApiProperty({ enum: TipoDocumentoTesis })
  @IsEnum(TipoDocumentoTesis)
  tipo: TipoDocumentoTesis;

  @ApiProperty()
  @IsString()
  archivo_url: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nombre_original?: string;

  @ApiProperty({
    required: false,
    description: 'Si no se envía, se incrementa según documentos previos del mismo tipo',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  version?: number;
}
