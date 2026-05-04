import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsNumberString,
  Length,
  IsInt,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@unitru.edu.pe' })
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
    },
  )
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(2, { message: 'Los nombres deben tener al menos 2 caracteres' })
  nombres: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(2, { message: 'Los apellidos deben tener al menos 2 caracteres' })
  apellidos: string;

  @ApiProperty({ example: '12345678' })
  @IsNumberString({}, { message: 'El DNI debe contener solo números' })
  @Length(8, 8, { message: 'El DNI debe tener exactamente 8 dígitos' })
  @Matches(/^\d{8}$/, { message: 'DNI debe ser 8 dígitos' })
  dni: string;

  @ApiProperty({ example: '987654321', required: false })
  @IsOptional()
  @IsString()
  telefono?: string;

  // ── Campos opcionales para crear el perfil de Estudiante ──────────────────
  // Si se envían, se crea automáticamente el registro en la tabla `estudiante`

  @ApiProperty({ example: '202412345', required: false })
  @IsOptional()
  @IsString()
  codigo_universitario?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'escuela_id debe ser un número entero' })
  escuela_id?: number;

  @ApiProperty({ example: 'V', required: false })
  @IsOptional()
  @IsString()
  ciclo?: string;
}