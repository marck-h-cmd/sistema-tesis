import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Max, Min } from 'class-validator';

export class RegistrarReciboTurnitinDto {
  @ApiProperty({ description: 'URL o clave del archivo del recibo de pago (~S/ 87)' })
  @IsString()
  recibo_url: string;
}

export class RegistrarSimilitudTurnitinDto {
  @ApiProperty({ example: 18.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje: number;
}
