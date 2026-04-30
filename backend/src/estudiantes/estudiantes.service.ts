import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';

@Injectable()
export class EstudiantesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.estudiante.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombres: true,
            apellidos: true,
            dni: true,
            telefono: true,
            activo: true,
          },
        },
        escuela: {
          select: {
            id: true,
            nombre: true,
            facultad: true,
          },
        },
        _count: {
          select: {
            postulaciones: true,
            tesis: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombres: true,
            apellidos: true,
            dni: true,
            telefono: true,
            activo: true,
          },
        },
        escuela: true,
        postulaciones: {
          include: {
            oferta: {
              include: {
                empresa: {
                  select: {
                    id: true,
                    razon_social: true,
                  },
                },
              },
            },
            asesor_academico: {
              include: {
                usuario: {
                  select: {
                    nombres: true,
                    apellidos: true,
                  },
                },
              },
            },
          },
          orderBy: { fecha_postulacion: 'desc' },
        },
        tesis: {
          include: {
            asesor_principal: {
              include: {
                usuario: {
                  select: {
                    nombres: true,
                    apellidos: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!estudiante) {
      throw new NotFoundException(`Estudiante con ID ${id} no encontrado`);
    }

    return estudiante;
  }

  async findByUsuarioId(usuarioId: number) {
    return this.prisma.estudiante.findUnique({
      where: { usuario_id: usuarioId },
    });
  }

  async create(createEstudianteDto: CreateEstudianteDto) {
    // Verificar si ya existe un estudiante con ese código
    const existing = await this.prisma.estudiante.findFirst({
      where: {
        codigo_universitario: createEstudianteDto.codigo_universitario,
      },
    });

    if (existing) {
      throw new ConflictException('El código universitario ya existe');
    }

    // Verificar que el usuario no sea ya un estudiante
    const existingUsuario = await this.prisma.estudiante.findUnique({
      where: { usuario_id: createEstudianteDto.usuario_id },
    });

    if (existingUsuario) {
      throw new ConflictException('El usuario ya está registrado como estudiante');
    }

    return this.prisma.estudiante.create({
      data: createEstudianteDto,
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombres: true,
            apellidos: true,
          },
        },
        escuela: true,
      },
    });
  }

  async update(id: number, updateEstudianteDto: UpdateEstudianteDto) {
    await this.findOne(id);

    if (updateEstudianteDto.codigo_universitario) {
      const existing = await this.prisma.estudiante.findFirst({
        where: {
          codigo_universitario: updateEstudianteDto.codigo_universitario,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('El código universitario ya existe');
      }
    }

    return this.prisma.estudiante.update({
      where: { id },
      data: updateEstudianteDto,
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombres: true,
            apellidos: true,
          },
        },
        escuela: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Verificar si tiene postulaciones activas
    const postulacionesActivas = await this.prisma.postulacion.count({
      where: {
        estudiante_id: id,
        estado: 'en_curso',
      },
    });

    if (postulacionesActivas > 0) {
      throw new ConflictException('No se puede eliminar: tiene prácticas en curso');
    }

    return this.prisma.estudiante.delete({
      where: { id },
    });
  }

  async getHistorialPracticas(estudianteId: number) {
    await this.findOne(estudianteId);

    return this.prisma.postulacion.findMany({
      where: { estudiante_id: estudianteId },
      include: {
        oferta: {
          include: {
            empresa: {
              select: {
                razon_social: true,
              },
            },
          },
        },
        seguimiento: true,
      },
      orderBy: { fecha_postulacion: 'desc' },
    });
  }

  async getTesis(estudianteId: number) {
    await this.findOne(estudianteId);

    return this.prisma.tesis.findMany({
      where: { estudiante_id: estudianteId },
      include: {
        asesor_principal: {
          include: {
            usuario: {
              select: {
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
        jurados: {
          include: {
            asesor: {
              include: {
                usuario: {
                  select: {
                    nombres: true,
                    apellidos: true,
                  },
                },
              },
            },
          },
        },
        avances: {
          orderBy: { fecha_entrega: 'desc' },
        },
        acta: true,
      },
    });
  }
}