import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReporteMensualDto {
  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  anio: number;

  @ApiProperty({ example: 5, description: 'Mes 1-12' })
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @ApiProperty({ example: 40 })
  @IsInt()
  @Min(0)
  horas_reportadas: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  archivo_url?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
