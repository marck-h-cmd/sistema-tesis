import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';
import { PppGateService } from '../ppp/ppp-gate.service';
import { EstadoPractica, EstadoTesis } from '@prisma/client';

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
        practica: true,
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
      include: { practica: true, oferta: { include: { empresa: true } } },
      orderBy: { fecha_postulacion: 'desc' },
    });

    const umbralRevision =
      this.configService.get<number>('practicas.horasMinimasRevisionInforme') ??
      300;

    const practicaRow = postulacionActiva?.practica;

    const horasMin =
      practicaRow != null
        ? {
            cumplidas: practicaRow.horas_cumplidas,
            totales: practicaRow.horas_totales,
            umbral_revision_informe: umbralRevision,
            puede_solicitar_revision_informe_final:
              practicaRow.horas_cumplidas >= umbralRevision &&
              (practicaRow.estado === EstadoPractica.en_ejecucion ||
                practicaRow.estado === EstadoPractica.plan_validado),
          }
        : null;

    const tesisActiva = await this.prisma.tesis.findFirst({
      where: {
        estudiante_id: estudianteId,
        estado: { not: EstadoTesis.culminado },
      },
      orderBy: { updated_at: 'desc' },
      select: { id: true, estado: true },
    });

    const workflowEtapa = this.resolverWorkflowEtapa({
      practicaEstado: practicaRow?.estado ?? null,
      tienePracticaAprobada: habilitacion.tiene_practica_aprobada,
      tesisEstado: tesisActiva?.estado ?? null,
    });

    return {
      ...habilitacion,
      modulo_tesis_desbloqueado: habilitacion.puede_registrar_tesis,
      /** Alias explícito para el condicional de sustentación en frontend */
      practicas_status: habilitacion.practicas_status,
      practicas_aprobadas: habilitacion.tiene_practica_aprobada,
      workflow_etapa: workflowEtapa,
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
      practica_id: practicaRow?.id ?? null,
      seguimiento_practica: practicaRow
        ? {
            id: practicaRow.id,
            estado_practica: practicaRow.estado,
            horas_cumplidas: practicaRow.horas_cumplidas,
            horas_totales: practicaRow.horas_totales,
            plan_validado: practicaRow.plan_validado,
            informe_aprobado: practicaRow.informe_aprobado,
          }
        : null,
      horas_resumen: horasMin,
      tesis_activa: tesisActiva,
    };
  }

  private resolverWorkflowEtapa(input: {
    practicaEstado: EstadoPractica | null;
    tienePracticaAprobada: boolean;
    tesisEstado: EstadoTesis | null;
  }):
    | 'practicante'
    | 'egresado'
    | 'tesista'
    | 'en_revision'
    | 'expedito'
    | 'sustentacion' {
    const { practicaEstado, tienePracticaAprobada, tesisEstado } = input;

    if (!tienePracticaAprobada) {
      if (
        practicaEstado === EstadoPractica.plan_pendiente ||
        practicaEstado === EstadoPractica.plan_validado
      ) {
        return 'practicante';
      }
      if (
        practicaEstado === EstadoPractica.informe_pendiente ||
        practicaEstado === EstadoPractica.en_ejecucion
      ) {
        return 'egresado';
      }
      return 'practicante';
    }

    if (
      !tesisEstado ||
      tesisEstado === EstadoTesis.propuesta ||
      tesisEstado === EstadoTesis.desarrollo
    ) {
      return 'tesista';
    }

    if (
      tesisEstado === EstadoTesis.en_revision ||
      tesisEstado === EstadoTesis.observaciones_emitidas ||
      tesisEstado === EstadoTesis.observaciones_levantadas ||
      tesisEstado === EstadoTesis.aprobado_jurado
    ) {
      return 'en_revision';
    }

    if (tesisEstado === EstadoTesis.expedito) {
      return 'expedito';
    }

    if (
      tesisEstado === EstadoTesis.sustentacion_programada ||
      tesisEstado === EstadoTesis.sustentado
    ) {
      return 'sustentacion';
    }

    return 'tesista';
  }
}