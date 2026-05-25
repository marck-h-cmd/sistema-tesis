import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
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
          include: { rol: true },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Credenciales inválidas');

    if (!user.activo) throw new UnauthorizedException('Usuario desactivado');

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
    // ── 1. Verificar duplicados ──────────────────────────────────────────────
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ email: registerDto.email }, { dni: registerDto.dni }],
      },
    });

    if (existingUser) {
      throw new ConflictException('El email o DNI ya están registrados');
    }

    // Si se envía código universitario, verificar que no exista
    if (registerDto.codigo_universitario) {
      const existingEstudiante = await this.prisma.estudiante.findUnique({
        where: { codigo_universitario: registerDto.codigo_universitario },
      });
      if (existingEstudiante) {
        throw new ConflictException('El código universitario ya está registrado');
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // ── 2. Obtener rol estudiante y escuela por defecto ──────────────────────
    const rolEstudiante = await this.prisma.rol.findUnique({
      where: { nombre: 'estudiante' },
    });

    if (!rolEstudiante) {
      throw new Error('Rol estudiante no encontrado en la base de datos');
    }

    // Escuela por defecto: la primera disponible si no se especifica
    let escuelaId = registerDto.escuela_id;
    if (!escuelaId) {
      const primeraEscuela = await this.prisma.escuela.findFirst();
      escuelaId = primeraEscuela?.id;
    }

    // ── 3. Crear todo en una transacción ─────────────────────────────────────
    const result = await this.prisma.$transaction(async (tx) => {
      // Crear usuario
      const user = await tx.usuario.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          nombres: registerDto.nombres,
          apellidos: registerDto.apellidos,
          dni: registerDto.dni,
          telefono: registerDto.telefono,
        },
      });

      // Asignar rol estudiante
      await tx.usuarioRol.create({
        data: {
          usuario_id: user.id,
          rol_id: rolEstudiante.id,
        },
      });

      // Crear perfil Estudiante (siempre, ya que el registro público es para estudiantes)
      if (escuelaId) {
        const codigoUniversitario =
          registerDto.codigo_universitario ||
          this.generarCodigoUniversitario(registerDto.dni);

        await tx.estudiante.create({
          data: {
            usuario_id: user.id,
            escuela_id: escuelaId,
            codigo_universitario: codigoUniversitario,
          },
        });
      }

      return user;
    });

    // ── 4. Devolver token igual que login ────────────────────────────────────
    return this.login({
      email: registerDto.email,
      password: registerDto.password,
    });
  }

  // ── Utilidad: genera código provisional a partir del DNI ──────────────────
  private generarCodigoUniversitario(dni: string): string {
    const year = new Date().getFullYear();
    // Formato: AÑO + últimos 5 dígitos del DNI  →  e.g. "202412345"
    return `${year}${dni.slice(-5)}`;
  }
}