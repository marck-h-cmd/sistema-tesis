import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';
import { UpdateSeguimientoDto } from './dto/update-seguimiento.dto';
import { EstadoPostulacion } from '@prisma/client';

@Injectable()
export class SeguimientoService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { estado?: string; asesor_id?: number }) {
    const where: any = {};

    if (filters?.estado) {
      where.evaluacion = filters.estado;
    }

    if (filters?.asesor_id) {
      where.postulacion = {
        asesor_academico_id: filters.asesor_id,
      };
    }

    return this.prisma.seguimientoPractica.findMany({
      where,
      include: {
        postulacion: {
          include: {
            estudiante: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombres: true,
                    apellidos: true,
                    email: true,
                  },
                },
                escuela: {
                  select: {
                    nombre: true,
                    facultad: true,
                  },
                },
              },
            },
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
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const seguimiento = await this.prisma.seguimientoPractica.findUnique({
      where: { id },
      include: {
        postulacion: {
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
          },
        },
      },
    });

    if (!seguimiento) {
      throw new NotFoundException(`Seguimiento con ID ${id} no encontrado`);
    }

    return seguimiento;
  }

  async findByPostulacion(postulacionId: number) {
    const seguimiento = await this.prisma.seguimientoPractica.findUnique({
      where: { postulacion_id: postulacionId },
    });

    if (!seguimiento) {
      throw new NotFoundException(
        `Seguimiento no encontrado para la postulación ${postulacionId}`,
      );
    }

    return seguimiento;
  }

  async create(createSeguimientoDto: CreateSeguimientoDto) {
    // Verificar que no exista ya un seguimiento para esta postulación
    const existing = await this.prisma.seguimientoPractica.findUnique({
      where: { postulacion_id: createSeguimientoDto.postulacion_id },
    });

    if (existing) {
      throw new ConflictException('Ya existe un seguimiento para esta postulación');
    }

    // Verificar que la postulación esté aceptada o en curso
    const postulacion = await this.prisma.postulacion.findUnique({
      where: { id: createSeguimientoDto.postulacion_id },
    });

    if (!postulacion || (postulacion.estado !== 'aceptado' && postulacion.estado !== 'en_curso')) {
      throw new ConflictException('La postulación no está activa para seguimiento');
    }

    return this.prisma.seguimientoPractica.create({
      data: createSeguimientoDto,
    });
  }

  async updateHoras(id: number, horas: number, tipo: 'sumar' | 'restar' = 'sumar') {
    const seguimiento = await this.findOne(id);

    const nuevasHoras =
      tipo === 'sumar'
        ? seguimiento.horas_cumplidas + horas
        : seguimiento.horas_cumplidas - horas;

    if (nuevasHoras < 0) {
      throw new ConflictException('Las horas no pueden ser negativas');
    }

    if (nuevasHoras > seguimiento.horas_totales) {
      throw new ConflictException(
        `No puede superar las ${seguimiento.horas_totales} horas totales`,
      );
    }

    return this.prisma.seguimientoPractica.update({
      where: { id },
      data: { horas_cumplidas: nuevasHoras },
    });
  }

  async updateInformes(
    id: number,
    updateSeguimientoDto: UpdateSeguimientoDto,
  ) {
    await this.findOne(id);

    return this.prisma.seguimientoPractica.update({
      where: { id },
      data: {
        informe_estudiante: updateSeguimientoDto.informe_estudiante,
        informe_asesor: updateSeguimientoDto.informe_asesor,
        evaluacion: updateSeguimientoDto.evaluacion,
        fecha_evaluacion: updateSeguimientoDto.fecha_evaluacion
          ? new Date(updateSeguimientoDto.fecha_evaluacion)
          : null,
      },
    });
  }

  async evaluarPractica(
    id: number,
    evaluacion: string,
    observaciones?: string,
  ) {
    const seguimiento = await this.findOne(id);

    // Verificar que cumpla con las horas mínimas (70% del total)
    const porcentajeCumplido =
      (seguimiento.horas_cumplidas / seguimiento.horas_totales) * 100;

    if (porcentajeCumplido < 70 && evaluacion === 'aprobado') {
      throw new ConflictException(
        `No cumple con el mínimo de horas requerido (${porcentajeCumplido.toFixed(1)}%)`,
      );
    }

    const updateData: any = {
      evaluacion,
      fecha_evaluacion: new Date(),
    };

    if (observaciones) {
      updateData.informe_asesor = observaciones;
    }

    // Actualizar el estado de la postulación
    const nuevoEstado: EstadoPostulacion =
      evaluacion === 'aprobado' ? 'finalizado' : 'en_curso';

    await this.prisma.postulacion.update({
      where: { id: seguimiento.postulacion_id },
      data: { estado: nuevoEstado },
    });

    return this.prisma.seguimientoPractica.update({
      where: { id },
      data: updateData,
    });
  }

  async getEstadisticasHoras() {
    const seguimientos = await this.prisma.seguimientoPractica.findMany({
      select: {
        horas_cumplidas: true,
        horas_totales: true,
        evaluacion: true,
      },
    });

    const totalEstudiantes = seguimientos.length;
    const completados = seguimientos.filter(
      (s) => s.evaluacion === 'aprobado',
    ).length;
    const enProgreso = seguimientos.filter(
      (s) => s.evaluacion === 'pendiente',
    ).length;

    const promedioHoras =
      totalEstudiantes > 0
        ? seguimientos.reduce((acc, s) => acc + s.horas_cumplidas, 0) / totalEstudiantes
        : 0;

    return {
      total_estudiantes_practica: totalEstudiantes,
      practicas_completadas: completados,
      practicas_en_progreso: enProgreso,
      promedio_horas_cumplidas: Math.round(promedioHoras),
      horas_totales_requeridas: 300,
    };
  }

  async getReportePorEstudiante(estudianteId: number) {
    const postulaciones = await this.prisma.postulacion.findMany({
      where: { estudiante_id: estudianteId },
      include: {
        seguimiento: true,
        oferta: {
          include: {
            empresa: {
              select: {
                razon_social: true,
              },
            },
          },
        },
      },
      orderBy: { fecha_postulacion: 'desc' },
    });

    const practicasCompletadas = postulaciones.filter(
      (p) => p.estado === 'finalizado' && p.seguimiento?.evaluacion === 'aprobado',
    );

    const totalHoras = practicasCompletadas.reduce(
      (acc, p) => acc + (p.seguimiento?.horas_cumplidas || 0),
      0,
    );

    return {
      estudiante_id: estudianteId,
      total_postulaciones: postulaciones.length,
      practicas_aprobadas: practicasCompletadas.length,
      total_horas_acumuladas: totalHoras,
      detalle: postulaciones.map((p) => ({
        oferta: p.oferta.titulo,
        empresa: p.oferta.empresa.razon_social,
        estado: p.estado,
        horas_cumplidas: p.seguimiento?.horas_cumplidas || 0,
        evaluacion: p.seguimiento?.evaluacion || 'pendiente',
      })),
    };
  }
}