import { IsEmail, IsString, MinLength, IsOptional, IsArray, IsEnum, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolNombre } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    { message: 'La contraseña debe ser segura' },
  )
  password: string;

  @ApiProperty()
  @IsString()
  nombres: string;

  @ApiProperty()
  @IsString()
  apellidos: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'DNI debe ser 8 dígitos' })
  dni: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ enum: RolNombre, isArray: true, required: false })
  @IsArray()
  @IsEnum(RolNombre, { each: true })
  @IsOptional()
  roles?: RolNombre[];
}