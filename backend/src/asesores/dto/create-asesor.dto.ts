import { IsInt, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAsesorDto {
  @ApiProperty()
  @IsInt()
  usuario_id: number;

  @ApiProperty()
  @IsInt()
  escuela_id: number;

  @ApiProperty({ example: 'Ingeniería de Software', required: false })
  @IsString()
  @IsOptional()
  especialidad?: string;
}