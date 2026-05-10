import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';
import { PppGateService } from '../ppp/ppp-gate.service';

@Injectable()
export class EstudiantesService {
  constructor(
    private prisma: PrismaService,
    private pppGate: PppGateService,
    private configService: ConfigService,
  ) {}

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

  async getByUserId(userId: number) {
    return this.prisma.estudiante.findUnique({
      where: { usuario_id: userId },
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

  /** Estado de gates PPP/Tesis para el frontend (bloqueos y flags). */
  async getEstadoModulos(estudianteId: number) {
    await this.findOne(estudianteId);

    const habilitacion =
      await this.pppGate.getDetalleHabilitacionTesis(estudianteId);

    const postulacionActiva = await this.prisma.postulacion.findFirst({
      where: {
        estudiante_id: estudianteId,
        estado: { in: ['postulado', 'aceptado', 'en_curso'] },
      },
      include: { seguimiento: true, oferta: { include: { empresa: true } } },
      orderBy: { fecha_postulacion: 'desc' },
    });

    const umbralRevision =
      this.configService.get<number>('practicas.horasMinimasRevisionInforme') ??
      600;

    const horasMin =
      postulacionActiva?.seguimiento?.horas_cumplidas != null
        ? {
            cumplidas: postulacionActiva.seguimiento.horas_cumplidas,
            totales: postulacionActiva.seguimiento.horas_totales,
            umbral_revision_informe: umbralRevision,
            puede_solicitar_revision_informe_final:
              postulacionActiva.seguimiento.horas_cumplidas >= umbralRevision,
          }
        : null;

    return {
      ...habilitacion,
      modulo_tesis_desbloqueado: habilitacion.puede_registrar_tesis,
      postulacion_practica_activa: postulacionActiva
        ? {
            id: postulacionActiva.id,
            estado: postulacionActiva.estado,
            requiere_convenio_especifico:
              postulacionActiva.requiere_convenio_especifico,
            estado_convenio_especifico:
              postulacionActiva.estado_convenio_especifico,
          }
        : null,
      seguimiento_practica: postulacionActiva?.seguimiento
        ? {
            id: postulacionActiva.seguimiento.id,
            horas_cumplidas: postulacionActiva.seguimiento.horas_cumplidas,
            horas_totales: postulacionActiva.seguimiento.horas_totales,
            solicitud_revision_informe_final:
              postulacionActiva.seguimiento.solicitud_revision_informe_final,
            evaluacion: postulacionActiva.seguimiento.evaluacion,
          }
        : null,
      horas_resumen: horasMin,
    };
  }
}