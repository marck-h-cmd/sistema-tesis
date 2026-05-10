import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSeguimientoDto } from '../seguimiento/dto/create-seguimiento.dto';
import { UpdateSeguimientoDto } from '../seguimiento/dto/update-seguimiento.dto';
import { CreateReporteMensualDto } from '../seguimiento/dto/create-reporte-mensual.dto';
import {
  EstadoPostulacion,
  EstadoPractica,
  TipoDocumentoPractica,
} from '@prisma/client';
import { ValidarPlanDto } from './dto/validar-plan.dto';
import { AprobarInformeDto } from './dto/aprobar-informe.dto';

const practicaFullInclude = {
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
  postulacion: {
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
  },
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
} as const;

@Injectable()
export class PracticasService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async findAll(filters?: { estado?: string; asesor_id?: number }) {
    const where: Record<string, unknown> = {};

    if (filters?.asesor_id) {
      where.asesor_id = filters.asesor_id;
    }

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    return this.prisma.practica.findMany({
      where,
      include: practicaFullInclude,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const practica = await this.prisma.practica.findUnique({
      where: { id },
      include: {
        ...practicaFullInclude,
        documentos: { orderBy: { subido_en: 'desc' } },
        reportes_mensuales: {
          orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
        },
      },
    });

    if (!practica) {
      throw new NotFoundException(`Práctica con ID ${id} no encontrada`);
    }

    return practica;
  }

  async findByPostulacion(postulacionId: number) {
    const practica = await this.prisma.practica.findUnique({
      where: { postulacion_id: postulacionId },
      include: practicaFullInclude,
    });

    if (!practica) {
      throw new NotFoundException(
        `No hay registro de práctica para la postulación ${postulacionId}`,
      );
    }

    return practica;
  }

  async findByEstudiante(estudianteId: number) {
    return this.prisma.practica.findMany({
      where: { estudiante_id: estudianteId },
      include: practicaFullInclude,
      orderBy: { created_at: 'desc' },
    });
  }

  /** Crear ficha de práctica manual (normalmente se crea al aceptar la postulación). */
  async create(createDto: CreateSeguimientoDto) {
    const existing = await this.prisma.practica.findUnique({
      where: { postulacion_id: createDto.postulacion_id },
    });

    if (existing) {
      throw new ConflictException('Ya existe práctica para esta postulación');
    }

    const postulacion = await this.prisma.postulacion.findUnique({
      where: { id: createDto.postulacion_id },
    });

    if (
      !postulacion ||
      (postulacion.estado !== EstadoPostulacion.aceptado &&
        postulacion.estado !== EstadoPostulacion.en_curso)
    ) {
      throw new ConflictException(
        'La postulación no está activa para registrar práctica',
      );
    }

    const horasTotales =
      createDto.horas_totales ??
      this.configService.get<number>('practicas.horasMinimasRevisionInforme') ??
      300;

    return this.prisma.practica.create({
      data: {
        estudiante_id: postulacion.estudiante_id,
        postulacion_id: createDto.postulacion_id,
        asesor_id: postulacion.asesor_academico_id ?? undefined,
        horas_totales: horasTotales,
        horas_cumplidas: createDto.horas_cumplidas ?? 0,
        estado: EstadoPractica.plan_pendiente,
      },
      include: practicaFullInclude,
    });
  }

  async updateHoras(id: number, horas: number, tipo: 'sumar' | 'restar' = 'sumar') {
    const practica = await this.findOne(id);

    const nuevasHoras =
      tipo === 'sumar'
        ? practica.horas_cumplidas + horas
        : practica.horas_cumplidas - horas;

    if (nuevasHoras < 0) {
      throw new ConflictException('Las horas no pueden ser negativas');
    }

    if (nuevasHoras > practica.horas_totales) {
      throw new ConflictException(
        `No puede superar las ${practica.horas_totales} horas totales`,
      );
    }

    return this.prisma.practica.update({
      where: { id },
      data: { horas_cumplidas: nuevasHoras },
    });
  }

  /** Legado: enlazar texto libre a campos de informe en Practica. */
  async updateInformes(id: number, updateDto: UpdateSeguimientoDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};

    if (updateDto.informe_estudiante != null) {
      data.informe_observaciones = updateDto.informe_estudiante;
    }
    if (updateDto.informe_asesor != null) {
      data.informe_observaciones = updateDto.informe_asesor;
    }

    return this.prisma.practica.update({
      where: { id },
      data,
    });
  }

  /**
   * Legado: equivalía a “cerrar evaluación”.
   * Solo aplica si la práctica está en informe_pendiente (cierra con aprobación del asesor vía flujo antiguo).
   */
  async evaluarPractica(id: number, evaluacion: string, observaciones?: string) {
    const practica = await this.findOne(id);

    if (evaluacion === 'aprobado') {
      if (practica.estado !== EstadoPractica.informe_pendiente) {
        throw new ConflictException(
          'Use el flujo de informe final: solo se aprueba desde estado informe_pendiente o mediante PUT .../informe-final/aprobar',
        );
      }
      const porcentajeCumplido =
        practica.horas_totales > 0
          ? (practica.horas_cumplidas / practica.horas_totales) * 100
          : 0;
      if (porcentajeCumplido < 70) {
        throw new ConflictException(
          `No cumple el mínimo de horas (${porcentajeCumplido.toFixed(1)}%)`,
        );
      }
      await this.prisma.postulacion.update({
        where: { id: practica.postulacion_id },
        data: { estado: EstadoPostulacion.finalizado },
      });
      return this.prisma.practica.update({
        where: { id },
        data: {
          estado: EstadoPractica.aprobado,
          informe_aprobado: true,
          informe_aprobado_en: new Date(),
          informe_observaciones: observaciones ?? practica.informe_observaciones,
        },
      });
    }

    return this.prisma.practica.update({
      where: { id },
      data: {
        informe_observaciones: observaciones ?? undefined,
      },
    });
  }

  async getEstadisticasHoras() {
    const practicas = await this.prisma.practica.findMany({
      select: {
        horas_cumplidas: true,
        horas_totales: true,
        estado: true,
      },
    });

    const totalEstudiantes = practicas.length;
    const completados = practicas.filter((p) => p.estado === EstadoPractica.aprobado)
      .length;
    const enProgreso = practicas.filter(
      (p) =>
        p.estado !== EstadoPractica.aprobado &&
        p.estado !== EstadoPractica.plan_pendiente,
    ).length;

    const promedioHoras =
      totalEstudiantes > 0
        ? practicas.reduce((acc, p) => acc + p.horas_cumplidas, 0) /
          totalEstudiantes
        : 0;

    const horasCfg =
      this.configService.get<number>('practicas.horasMinimasRevisionInforme') ??
      300;

    return {
      total_estudiantes_practica: totalEstudiantes,
      practicas_completadas: completados,
      practicas_en_progreso: enProgreso,
      promedio_horas_cumplidas: Math.round(promedioHoras),
      horas_totales_requeridas: horasCfg,
    };
  }

  async registrarReporteMensual(practicaId: number, dto: CreateReporteMensualDto) {
    await this.findOne(practicaId);

    const row = await this.prisma.reporteMensualPractica.upsert({
      where: {
        practica_id_anio_mes: {
          practica_id: practicaId,
          anio: dto.anio,
          mes: dto.mes,
        },
      },
      create: {
        practica_id: practicaId,
        anio: dto.anio,
        mes: dto.mes,
        horas_reportadas: dto.horas_reportadas,
        archivo_url: dto.archivo_url,
        observaciones: dto.observaciones,
      },
      update: {
        horas_reportadas: dto.horas_reportadas,
        archivo_url: dto.archivo_url,
        observaciones: dto.observaciones,
      },
    });

    const agg = await this.prisma.reporteMensualPractica.aggregate({
      where: { practica_id: practicaId },
      _sum: { horas_reportadas: true },
    });
    const totalReportado = agg._sum.horas_reportadas ?? 0;

    await this.prisma.practica.update({
      where: { id: practicaId },
      data: { horas_cumplidas: totalReportado },
    });

    return row;
  }

  async listarReportesMensuales(practicaId: number) {
    await this.findOne(practicaId);
    return this.prisma.reporteMensualPractica.findMany({
      where: { practica_id: practicaId },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    });
  }

  async solicitarRevisionInformeFinal(practicaId: number) {
    const practica = await this.findOne(practicaId);
    const horasMin =
      this.configService.get<number>('practicas.horasMinimasRevisionInforme') ??
      300;

    if (practica.horas_cumplidas < horasMin) {
      throw new ConflictException(
        `No alcanza el mínimo de ${horasMin} horas cumplidas para el informe final.`,
      );
    }

    if (
      practica.estado !== EstadoPractica.en_ejecucion &&
      practica.estado !== EstadoPractica.plan_validado
    ) {
      throw new ConflictException(
        'Solo puede solicitar revisión del informe en ejecución de prácticas.',
      );
    }

    return this.prisma.practica.update({
      where: { id: practicaId },
      data: { estado: EstadoPractica.informe_pendiente },
    });
  }

  async getReportePorEstudiante(estudianteId: number) {
    const postulaciones = await this.prisma.postulacion.findMany({
      where: { estudiante_id: estudianteId },
      include: {
        practica: true,
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

    const practicasAprobadas = postulaciones.filter(
      (p) =>
        p.estado === EstadoPostulacion.finalizado ||
        p.practica?.estado === EstadoPractica.aprobado,
    );

    const totalHoras = practicasAprobadas.reduce(
      (acc, p) => acc + (p.practica?.horas_cumplidas || 0),
      0,
    );

    return {
      estudiante_id: estudianteId,
      total_postulaciones: postulaciones.length,
      practicas_aprobadas: practicasAprobadas.length,
      total_horas_acumuladas: totalHoras,
      detalle: postulaciones.map((p) => ({
        oferta: p.oferta.titulo,
        empresa: p.oferta.empresa.razon_social,
        estado_postulacion: p.estado,
        estado_practica: p.practica?.estado ?? 'sin_registro',
        horas_cumplidas: p.practica?.horas_cumplidas ?? 0,
      })),
    };
  }

  async assertEsEstudiantePractica(practicaId: number, usuarioId: number) {
    const practica = await this.findOne(practicaId);
    const est = await this.prisma.estudiante.findUnique({
      where: { usuario_id: usuarioId },
    });
    if (!est || est.id !== practica.estudiante_id) {
      throw new ForbiddenException('No puede modificar esta práctica.');
    }
    return practica;
  }

  async subirPlanPracticas(
    practicaId: number,
    archivoUrl: string,
    nombreOriginal: string | undefined,
    usuarioId: number,
  ) {
    const practica = await this.assertEsEstudiantePractica(practicaId, usuarioId);

    if (practica.estado !== EstadoPractica.plan_pendiente) {
      throw new ConflictException(
        'El plan solo se registra cuando la práctica está pendiente de validación.',
      );
    }

    await this.prisma.documentoPractica.create({
      data: {
        practica_id: practicaId,
        tipo: TipoDocumentoPractica.plan_practicas,
        archivo_url: archivoUrl,
        nombre_original: nombreOriginal,
        subido_por: usuarioId,
      },
    });

    return this.prisma.practica.update({
      where: { id: practicaId },
      data: {
        plan_practicas_url: archivoUrl,
        plan_practicas_subido_en: new Date(),
      },
      include: practicaFullInclude,
    });
  }

  async validarPlanAdministrativo(
    practicaId: number,
    usuarioValidadorId: number,
    dto: ValidarPlanDto,
  ) {
    const practica = await this.findOne(practicaId);

    if (!practica.plan_practicas_url) {
      throw new ConflictException(
        'No hay plan de prácticas cargado para validar.',
      );
    }

    if (dto.aprobado) {
      const updated = await this.prisma.practica.update({
        where: { id: practicaId },
        data: {
          plan_validado: true,
          plan_validado_por: usuarioValidadorId,
          plan_validado_en: new Date(),
          plan_observaciones: dto.observaciones ?? null,
          estado: EstadoPractica.en_ejecucion,
        },
        include: practicaFullInclude,
      });

      await this.prisma.documentoPractica.updateMany({
        where: {
          practica_id: practicaId,
          tipo: TipoDocumentoPractica.plan_practicas,
        },
        data: {
          validado: true,
          validado_por: usuarioValidadorId,
          validado_en: new Date(),
          observaciones: dto.observaciones ?? undefined,
        },
      });

      return updated;
    }

    return this.prisma.practica.update({
      where: { id: practicaId },
      data: {
        plan_validado: false,
        plan_observaciones: dto.observaciones ?? null,
        estado: EstadoPractica.plan_pendiente,
      },
      include: practicaFullInclude,
    });
  }

  async registrarInformeFinal(
    practicaId: number,
    archivoUrl: string,
    nombreOriginal: string | undefined,
    usuarioId: number,
  ) {
    const practica = await this.findOne(practicaId);

    const esEstudiante = await this.prisma.estudiante.findFirst({
      where: { usuario_id: usuarioId, id: practica.estudiante_id },
    });
    const asesor = await this.prisma.asesor.findUnique({
      where: { usuario_id: usuarioId },
    });
    const esAsesorPractica =
      asesor != null && practica.asesor_id != null && asesor.id === practica.asesor_id;

    if (!esEstudiante && !esAsesorPractica) {
      throw new ForbiddenException(
        'Solo el estudiante o el asesor de la práctica pueden cargar el informe final.',
      );
    }

    if (
      practica.estado !== EstadoPractica.informe_pendiente &&
      practica.estado !== EstadoPractica.en_ejecucion
    ) {
      throw new ConflictException(
        'El informe final solo se registra en ejecución o pendiente de firma.',
      );
    }

    await this.prisma.documentoPractica.create({
      data: {
        practica_id: practicaId,
        tipo: TipoDocumentoPractica.informe_final,
        archivo_url: archivoUrl,
        nombre_original: nombreOriginal,
        subido_por: usuarioId,
      },
    });

    return this.prisma.practica.update({
      where: { id: practicaId },
      data: {
        informe_final_url: archivoUrl,
        informe_final_subido_en: new Date(),
        estado:
          practica.estado === EstadoPractica.en_ejecucion
            ? EstadoPractica.informe_pendiente
            : practica.estado,
      },
      include: practicaFullInclude,
    });
  }

  async registrarActaAprobacionAsesor(
    practicaId: number,
    archivoUrl: string,
    nombreOriginal: string | undefined,
    usuarioId: number,
  ) {
    const practica = await this.findOne(practicaId);
    const asesor = await this.prisma.asesor.findUnique({
      where: { usuario_id: usuarioId },
    });

    if (
      !asesor ||
      practica.asesor_id == null ||
      asesor.id !== practica.asesor_id
    ) {
      throw new ForbiddenException(
        'Solo el asesor asignado puede cargar el acta de aprobación.',
      );
    }

    await this.prisma.documentoPractica.create({
      data: {
        practica_id: practicaId,
        tipo: TipoDocumentoPractica.acta_aprobacion_asesor,
        archivo_url: archivoUrl,
        nombre_original: nombreOriginal,
        subido_por: usuarioId,
      },
    });

    return this.prisma.practica.findUnique({
      where: { id: practicaId },
      include: practicaFullInclude,
    });
  }

  async aprobarInformeFinal(
    practicaId: number,
    usuarioId: number,
    dto: AprobarInformeDto,
  ) {
    const practica = await this.findOne(practicaId);
    const asesor = await this.prisma.asesor.findUnique({
      where: { usuario_id: usuarioId },
    });

    if (
      !asesor ||
      practica.asesor_id == null ||
      asesor.id !== practica.asesor_id
    ) {
      throw new ForbiddenException(
        'Solo el asesor asignado puede aprobar el informe final.',
      );
    }

    if (practica.estado !== EstadoPractica.informe_pendiente) {
      throw new ConflictException(
        'El informe debe estar pendiente de firma/aprobación del asesor.',
      );
    }

    if (!practica.informe_final_url && !dto.acta_aprobacion_url) {
      throw new ConflictException(
        'Debe existir un informe cargado o adjuntar el acta de aprobación.',
      );
    }

    const porcentajeCumplido =
      practica.horas_totales > 0
        ? (practica.horas_cumplidas / practica.horas_totales) * 100
        : 0;
    if (porcentajeCumplido < 70) {
      throw new ConflictException(
        `No cumple el mínimo de horas (${porcentajeCumplido.toFixed(1)}%).`,
      );
    }

    if (dto.acta_aprobacion_url) {
      await this.prisma.documentoPractica.create({
        data: {
          practica_id: practicaId,
          tipo: TipoDocumentoPractica.acta_aprobacion_asesor,
          archivo_url: dto.acta_aprobacion_url,
          subido_por: usuarioId,
        },
      });
    }

    await this.prisma.postulacion.update({
      where: { id: practica.postulacion_id },
      data: { estado: EstadoPostulacion.finalizado },
    });

    return this.prisma.practica.update({
      where: { id: practicaId },
      data: {
        estado: EstadoPractica.aprobado,
        informe_aprobado: true,
        informe_aprobado_en: new Date(),
        informe_aprobado_por: asesor.id,
        informe_observaciones: dto.observaciones ?? undefined,
      },
      include: practicaFullInclude,
    });
  }

  /** Resolución de facultad (administrativo). Opcional para archivar expediente. */
  async cargarResolucionFacultad(
    practicaId: number,
    usuarioId: number,
    payload: { numero?: string; archivo_url: string },
  ) {
    await this.findOne(practicaId);

    await this.prisma.documentoPractica.create({
      data: {
        practica_id: practicaId,
        tipo: TipoDocumentoPractica.resolucion_facultad,
        archivo_url: payload.archivo_url,
        subido_por: usuarioId,
      },
    });

    return this.prisma.practica.update({
      where: { id: practicaId },
      data: {
        resolucion_numero: payload.numero,
        resolucion_url: payload.archivo_url,
        resolucion_cargado_en: new Date(),
        resolucion_cargado_por: usuarioId,
      },
      include: practicaFullInclude,
    });
  }

  /** Usado por la puerta de tesis y sustentación. */
  async tienePracticaAprobada(estudianteId: number): Promise<boolean> {
    const row = await this.prisma.practica.findFirst({
      where: {
        estudiante_id: estudianteId,
        estado: EstadoPractica.aprobado,
      },
    });
    return !!row;
  }
}
