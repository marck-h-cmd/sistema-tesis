import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidarPlanDto {
  @ApiProperty({ description: 'Si es true, secretaría autoriza y la práctica pasa a En Ejecución' })
  @IsBoolean()
  aprobado: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
