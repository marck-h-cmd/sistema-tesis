import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidos: true,
        dni: true,
        telefono: true,
        activo: true,
        created_at: true,
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidos: true,
        dni: true,
        telefono: true,
        activo: true,
        created_at: true,
        updated_at: true,
        roles: {
          include: {
            rol: true,
          },
        },
        estudiante: {
          select: {
            id: true,
            codigo_universitario: true,
            escuela: {
              select: {
                id: true,
                nombre: true,
                facultad: true,
              },
            },
          },
        },
        asesor: {
          select: {
            id: true,
            especialidad: true,
            escuela: {
              select: {
                id: true,
                nombre: true,
                facultad: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { dni: createUserDto.dni },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('El email o DNI ya existen');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.usuario.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        nombres: createUserDto.nombres,
        apellidos: createUserDto.apellidos,
        dni: createUserDto.dni,
        telefono: createUserDto.telefono,
      },
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidos: true,
        dni: true,
        telefono: true,
        activo: true,
        created_at: true,
      },
    });

    // Asignar roles si se proporcionan
    if (createUserDto.roles && createUserDto.roles.length > 0) {
      const roles = await this.prisma.rol.findMany({
        where: {
          nombre: {
            in: createUserDto.roles,
          },
        },
      });

      await this.prisma.usuarioRol.createMany({
        data: roles.map((rol) => ({
          usuario_id: user.id,
          rol_id: rol.id,
        })),
      });
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    const data: any = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    } else {
      delete data.password;
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidos: true,
        dni: true,
        telefono: true,
        activo: true,
        updated_at: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Soft delete: desactivar en lugar de eliminar
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
    });
  }

  async assignRole(userId: number, roleName: string) {
    const user = await this.findOne(userId);
    const role = await this.prisma.rol.findUnique({
      where: { nombre: roleName as any },
    });

    if (!role) {
      throw new NotFoundException(`Rol ${roleName} no encontrado`);
    }

    // Verificar si ya tiene el rol
    const existingRole = await this.prisma.usuarioRol.findUnique({
      where: {
        usuario_id_rol_id: {
          usuario_id: userId,
          rol_id: role.id,
        },
      },
    });

    if (!existingRole) {
      await this.prisma.usuarioRol.create({
        data: {
          usuario_id: userId,
          rol_id: role.id,
        },
      });
    }

    return this.findOne(userId);
  }

  async removeRole(userId: number, roleName: string) {
    const role = await this.prisma.rol.findUnique({
      where: { nombre: roleName as any },
    });

    if (!role) {
      throw new NotFoundException(`Rol ${roleName} no encontrado`);
    }

    await this.prisma.usuarioRol.deleteMany({
      where: {
        usuario_id: userId,
        rol_id: role.id,
      },
    });

    return this.findOne(userId);
  }
}