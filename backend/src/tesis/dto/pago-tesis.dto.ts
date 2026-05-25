import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoPago, TipoPago } from '@prisma/client';

export class CrearPagoTesisDto {
  @ApiProperty({ enum: TipoPago })
  @IsEnum(TipoPago)
  tipo: TipoPago;

  @ApiProperty({ example: 87 })
  @IsNumber()
  @Min(0)
  monto: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class CargarComprobantePagoDto {
  @ApiProperty()
  @IsString()
  comprobante_url: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class VerificarPagoTesisDto {
  @ApiProperty({
    enum: EstadoPago,
    description: 'Normalmente verificado (Pagado) o rechazado',
  })
  @IsEnum(EstadoPago)
  estado: EstadoPago;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
