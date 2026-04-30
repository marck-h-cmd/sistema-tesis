import { IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AsignarJuradoDto {
  @ApiProperty()
  @IsInt()
  asesor_id: number;

  @ApiProperty({ example: 'presidente' })
  @IsString()
  rol: string;
}