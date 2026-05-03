import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostulacionDto } from './dto/create-postulacion.dto';
import { UpdatePostulacionDto } from './dto/update-postulacion.dto';

@Injectable()
export class PostulacionesService {
  constructor(private prisma: PrismaService) {}

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
        seguimiento: true,
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
        seguimiento: true,
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
        seguimiento: true,
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

    // Verificar que la oferta esté abierta
    const oferta = await this.prisma.ofertaPractica.findUnique({
      where: { id: createPostulacionDto.oferta_id },
    });

    if (!oferta) {
      throw new NotFoundException('Oferta no encontrada');
    }

    if (oferta.estado !== 'abierta') {
      throw new ConflictException('La oferta no está disponible');
    }

    // Verificar vacantes
    const postulantesAceptados = await this.prisma.postulacion.count({
      where: {
        oferta_id: createPostulacionDto.oferta_id,
        estado: 'aceptado',
      },
    });

    if (postulantesAceptados >= oferta.vacantes) {
      throw new ConflictException('No hay vacantes disponibles');
    }

    // Crear la postulación
    const postulacion = await this.prisma.postulacion.create({
      data: {
        oferta_id: createPostulacionDto.oferta_id,
        estudiante_id: createPostulacionDto.estudiante_id,
        estado: 'postulado',
        fecha_postulacion: new Date(),
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

    const data: any = { estado: updatePostulacionDto.estado };

    // Si se acepta la postulación, crear seguimiento
    if (updatePostulacionDto.estado === 'aceptado') {
      const existingSeguimiento = await this.prisma.seguimientoPractica.findUnique({
        where: { postulacion_id: id },
      });

      if (!existingSeguimiento) {
        await this.prisma.seguimientoPractica.create({
          data: {
            postulacion_id: id,
            horas_cumplidas: 0,
            horas_totales: 300,
            evaluacion: 'pendiente',
          },
        });
      }
    }

    // Si se rechaza o finaliza, actualizar estado
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
        seguimiento: true,
      },
    });

    return updatedPostulacion;
  }

  async asignarAsesor(postulacionId: number, asesorId: number) {
    await this.findOne(postulacionId);

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
        data: { asesor_academico_id: asesorId },
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
        data: { asesor_academico_id: asesorId },
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
        seguimiento: true,
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