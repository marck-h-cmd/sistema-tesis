import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoConvenioEspecifico } from '@prisma/client';

export class UpdateConvenioEspecificoDto {
  @ApiProperty({ enum: EstadoConvenioEspecifico })
  @IsEnum(EstadoConvenioEspecifico)
  estado: EstadoConvenioEspecifico;
}
