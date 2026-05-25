import { IsInt, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEstudianteDto {
  @ApiProperty()
  @IsInt()
  usuario_id: number;

  @ApiProperty({ example: '2020123456' })
  @IsString()
  codigo_universitario: string;

  @ApiProperty()
  @IsInt()
  escuela_id: number;
}