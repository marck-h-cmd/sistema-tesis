import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.activo) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((ur) => ur.rol.nombre),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
        roles: user.roles.map((ur) => ur.rol.nombre),
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email: registerDto.email },
          { dni: registerDto.dni },
        ],
      },
    });

    if (existingUser) {
      throw new UnauthorizedException('El email o DNI ya están registrados');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.usuario.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        nombres: registerDto.nombres,
        apellidos: registerDto.apellidos,
        dni: registerDto.dni,
        telefono: registerDto.telefono,
      },
    });

    // Asignar rol por defecto (estudiante)
    const rolEstudiante = await this.prisma.rol.findUnique({
      where: { nombre: 'estudiante' },
    });

    if (rolEstudiante) {
      await this.prisma.usuarioRol.create({
        data: {
          usuario_id: user.id,
          rol_id: rolEstudiante.id,
        },
      });
    }

    return this.login({
      email: registerDto.email,
      password: registerDto.password,
    });
  }
}