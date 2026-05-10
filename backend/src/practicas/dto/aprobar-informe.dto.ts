import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AprobarInformeDto {
  @ApiProperty({
    required: false,
    description: 'URL del acta de aprobación firmada (opcional si solo se registra la firma en sistema)',
  })
  @IsString()
  @IsOptional()
  acta_aprobacion_url?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
