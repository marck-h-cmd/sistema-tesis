import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpresaDto {
  @ApiProperty({ example: '20123456789' })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'RUC debe ser 11 dígitos' })
  ruc: string;

  @ApiProperty({ example: 'Empresa XYZ S.A.C.' })
  @IsString()
  razon_social: string;

  @ApiProperty({ example: 'Av. Principal 123', required: false })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiProperty({ example: '987654321', required: false })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ example: 'contacto@empresa.com', required: false })
  @IsString()
  @IsOptional()
  email_contacto?: string;

  @ApiProperty({ example: 'Juan Pérez', required: false })
  @IsString()
  @IsOptional()
  representante?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  convenio_activo?: boolean;
}