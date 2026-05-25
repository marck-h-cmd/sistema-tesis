import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostulacionDto } from './dto/create-postulacion.dto';
import { UpdatePostulacionDto } from './dto/update-postulacion.dto';
import { UpdateConvenioEspecificoDto } from './dto/update-convenio-especifico.dto';
import { EmpresasService } from '../empresas/empresas.service';
import {
  EstadoConvenioEspecifico,
  EstadoPostulacion,
  EstadoPractica,
} from '@prisma/client';

@Injectable()
export class PostulacionesService {
  constructor(
    private prisma: PrismaService,
    private empresasService: EmpresasService,
  ) {}

  async findAll() {
    return this.prisma.postulacion.findMany({
      include: {
        estudiante: {
          include: {
            usuario: {
              select: {
                nombres: true,
                apellidos: true,
                email: true,
              },
            },
            escuela: true,
          },
        },
        oferta: {
          include: {
            empresa: {
              select: {
                razon_social: true,
                ruc: true,
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
        practica: true,
      },
      orderBy: { fecha_postulacion: 'desc' },
    });
  }

  async findOne(id: number) {
    const postulacion = await this.prisma.postulacion.findUnique({
      where: { id },
      include: {
        estudiante: {
          include: {
            usuario: true,
            escuela: true,
          },
        },
        oferta: {
          include: {
            empresa: true,
          },
        },
        asesor_academico: {
          include: {
            usuario: true,
          },
        },
        practica: true,
      },
    });

    if (!postulacion) {
      throw new NotFoundException(`Postulación con ID ${id} no encontrada`);
    }

    return postulacion;
  }

  // Obtener postulaciones de un estudiante específico
  async findByEstudiante(estudianteId: number) {
    const postulaciones = await this.prisma.postulacion.findMany({
      where: {
        estudiante_id: estudianteId,
      },
      include: {
        oferta: {
          include: {
            empresa: {
              select: {
                razon_social: true,
                ruc: true,
              },
            },
          },
        },
        practica: true,
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
    });

    return postulaciones;
  }

  // Verificar si un estudiante ya se postuló a una oferta
  async verificarPostulacion(estudianteId: number, ofertaId: number) {
    const postulacion = await this.prisma.postulacion.findFirst({
      where: {
        estudiante_id: estudianteId,
        oferta_id: ofertaId,
        estado: {
          in: ['postulado', 'aceptado', 'en_curso'],
        },
      },
    });

    return !!postulacion;
  }

  async create(createPostulacionDto: CreatePostulacionDto) {
    // Verificar que el estudiante no se haya postulado ya
    const existing = await this.prisma.postulacion.findFirst({
      where: {
        estudiante_id: createPostulacionDto.estudiante_id,
        oferta_id: createPostulacionDto.oferta_id,
        estado: {
          in: ['postulado', 'aceptado', 'en_curso'],
        },
      },
    });

    if (existing) {
      throw new ConflictException('Ya te has postulado a esta oferta');
    }

    const ofertaCompleta = await this.prisma.ofertaPractica.findUnique({
      where: { id: createPostulacionDto.oferta_id },
      include: { empresa: true },
    });

    if (!ofertaCompleta) {
      throw new NotFoundException('Oferta no encontrada');
    }

    if (ofertaCompleta.estado !== 'abierta') {
      throw new ConflictException('La oferta no está disponible');
    }

    const postulantesAceptados = await this.prisma.postulacion.count({
      where: {
        oferta_id: createPostulacionDto.oferta_id,
        estado: 'aceptado',
      },
    });

    if (postulantesAceptados >= ofertaCompleta.vacantes) {
      throw new ConflictException('No hay vacantes disponibles');
    }

    const convenioVigente = await this.empresasService.empresaTieneConvenioVigente(
      ofertaCompleta.empresa_id,
    );
    const requiereConvenioEspecifico = !convenioVigente;
    const estadoConvenioEspecifico = convenioVigente
      ? EstadoConvenioEspecifico.no_aplica
      : EstadoConvenioEspecifico.pendiente;

    // Crear la postulación
    const postulacion = await this.prisma.postulacion.create({
      data: {
        oferta_id: createPostulacionDto.oferta_id,
        estudiante_id: createPostulacionDto.estudiante_id,
        estado: 'postulado',
        fecha_postulacion: new Date(),
        requiere_convenio_especifico: requiereConvenioEspecifico,
        estado_convenio_especifico: estadoConvenioEspecifico,
        cv_url: createPostulacionDto.cv_url,
        ...(createPostulacionDto.asesor_academico_id && {
          asesor_academico_id: createPostulacionDto.asesor_academico_id,
        }),
      },
      include: {
        oferta: {
          include: {
            empresa: true,
          },
        },
        estudiante: {
          include: {
            usuario: true,
            escuela: true,
          },
        },
      },
    });

    return postulacion;
  }

  async updateEstado(id: number, updatePostulacionDto: UpdatePostulacionDto) {
    const postulacion = await this.findOne(id);

    // if (updatePostulacionDto.estado === 'aceptado') {
    //   if (
    //     postulacion.requiere_convenio_especifico &&
    //     postulacion.estado_convenio_especifico !== EstadoConvenioEspecifico.aprobado
    //   ) {
    //     throw new ConflictException(
    //       'No se puede aceptar la postulación: el convenio específico debe estar aprobado.',
    //     );
    //   }
    // }

    const data: any = { estado: updatePostulacionDto.estado };

    if (updatePostulacionDto.estado === 'aceptado') {
      const existingPractica = await this.prisma.practica.findUnique({
        where: { postulacion_id: id },
      });

      if (!existingPractica) {
        await this.prisma.practica.create({
          data: {
            estudiante_id: postulacion.estudiante_id,
            postulacion_id: id,
            asesor_id: postulacion.asesor_academico_id ?? undefined,
            horas_cumplidas: 0,
            horas_totales: 300,
            estado: EstadoPractica.plan_pendiente,
          },
        });
      }

      // Reducir vacantes de la OfertaPractica
      const oferta = await this.prisma.ofertaPractica.findUnique({
        where: { id: postulacion.oferta_id }
      });
      if (oferta && oferta.vacantes > 0) {
        await this.prisma.ofertaPractica.update({
          where: { id: oferta.id },
          data: { vacantes: oferta.vacantes - 1 }
        });
      }
    }

    const updatedPostulacion = await this.prisma.postulacion.update({
      where: { id },
      data,
      include: {
        oferta: {
          include: {
            empresa: true,
          },
        },
        estudiante: {
          include: {
            usuario: true,
          },
        },
        practica: true,
      },
    });

    return updatedPostulacion;
  }

  async updateConvenioEspecifico(
    id: number,
    dto: UpdateConvenioEspecificoDto,
  ) {
    const postulacion = await this.findOne(id);

    if (!postulacion.requiere_convenio_especifico) {
      throw new ConflictException(
        'Esta postulación no requiere trámite de convenio específico.',
      );
    }

    return this.prisma.postulacion.update({
      where: { id },
      data: { estado_convenio_especifico: dto.estado },
      include: {
        oferta: {
          include: { empresa: true },
        },
        estudiante: {
          include: {
            usuario: {
              select: { nombres: true, apellidos: true, email: true },
            },
          },
        },
        practica: true,
      },
    });
  }

  async asignarAsesor(postulacionId: number, asesorId: number) {
    const postulacion = await this.findOne(postulacionId);

    const asesor = await this.prisma.asesor.findUnique({
      where: { id: asesorId },
      select: { id: true },
    });
    if (!asesor) {
      throw new NotFoundException(`Asesor con ID ${asesorId} no encontrado`);
    }

    // Verificar si ya tiene asesor asignado
    const existing = await this.prisma.asesorPostulacion.findUnique({
      where: { postulacion_id: postulacionId },
    });

    let result;
    if (existing) {
      // Actualizar
      result = await this.prisma.asesorPostulacion.update({
        where: { postulacion_id: postulacionId },
        data: { asesor_id: asesorId },
        include: {
          asesor: {
            include: {
              usuario: true,
            },
          },
        },
      });

      // También actualizar el asesor_academico_id en la postulación
      await this.prisma.postulacion.update({
        where: { id: postulacionId },
        data: {
          asesor_academico_id: asesorId,
          ...(postulacion.estado === EstadoPostulacion.aceptado && {
            estado: EstadoPostulacion.en_curso,
          }),
        },
      });

      await this.prisma.practica.updateMany({
        where: {
          postulacion_id: postulacionId,
          estado: { in: [EstadoPractica.plan_pendiente, EstadoPractica.plan_validado] },
        },
        data: { asesor_id: asesorId, estado: EstadoPractica.en_ejecucion },
      });

      await this.prisma.practica.updateMany({
        where: {
          postulacion_id: postulacionId,
          NOT: {
            estado: { in: [EstadoPractica.plan_pendiente, EstadoPractica.plan_validado] },
          },
        },
        data: { asesor_id: asesorId },
      });
    } else {
      // Crear asignación
      result = await this.prisma.asesorPostulacion.create({
        data: {
          asesor_id: asesorId,
          postulacion_id: postulacionId,
        },
        include: {
          asesor: {
            include: {
              usuario: true,
            },
          },
        },
      });

      // Actualizar el asesor_academico_id en la postulación
      await this.prisma.postulacion.update({
        where: { id: postulacionId },
        data: {
          asesor_academico_id: asesorId,
          ...(postulacion.estado === EstadoPostulacion.aceptado && {
            estado: EstadoPostulacion.en_curso,
          }),
        },
      });

      await this.prisma.practica.updateMany({
        where: {
          postulacion_id: postulacionId,
          estado: { in: [EstadoPractica.plan_pendiente, EstadoPractica.plan_validado] },
        },
        data: { asesor_id: asesorId, estado: EstadoPractica.en_ejecucion },
      });

      await this.prisma.practica.updateMany({
        where: {
          postulacion_id: postulacionId,
          NOT: {
            estado: { in: [EstadoPractica.plan_pendiente, EstadoPractica.plan_validado] },
          },
        },
        data: { asesor_id: asesorId },
      });
    }

    return result;
  }

  // Obtener estadísticas de postulaciones por estado
  async getEstadisticasPorEstado() {
    const estadisticas = await this.prisma.postulacion.groupBy({
      by: ['estado'],
      _count: {
        id: true,
      },
    });

    return estadisticas.map(stat => ({
      estado: stat.estado,
      total: stat._count.id,
    }));
  }

  // Obtener postulaciones por oferta
  async findByOferta(ofertaId: number) {
    const postulaciones = await this.prisma.postulacion.findMany({
      where: {
        oferta_id: ofertaId,
      },
      include: {
        estudiante: {
          include: {
            usuario: {
              select: {
                nombres: true,
                apellidos: true,
                email: true,
              },
            },
            escuela: true,
          },
        },
        practica: true,
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
    });

    return postulaciones;
  }

  // Eliminar una postulación (solo si está en estado postulado)
  async remove(id: number) {
    const postulacion = await this.findOne(id);

    if (postulacion.estado !== 'postulado') {
      throw new ConflictException('Solo se pueden cancelar postulaciones en estado "postulado"');
    }

    return this.prisma.postulacion.delete({
      where: { id },
    });
  }
}
