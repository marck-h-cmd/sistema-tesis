import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTesisDto } from './dto/create-tesis.dto';
import { UpdateTesisDto } from './dto/update-tesis.dto';
import { AdminUpdateTesisDto } from './dto/admin-update-tesis.dto';
import { AsignarJuradoDto } from './dto/asignar-jurado.dto';
import { CreateAvanceDto } from './dto/create-avance.dto';
import { SubirDocumentoTesisDto } from './dto/subir-documento-tesis.dto';
import {
  CrearPagoTesisDto,
  CargarComprobantePagoDto,
  VerificarPagoTesisDto,
} from './dto/pago-tesis.dto';
import { ValidarDocumentoTesisDto } from './dto/validar-documento-tesis.dto';
import { RevisionJuradoObservacionesDto } from './dto/revision-jurado.dto';
import {
  EstadoTesis,
  EstadoRevisionJurado,
  EstadoPago,
  TipoDocumentoTesis,
} from '@prisma/client';
import { PppGateService } from '../ppp/ppp-gate.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class TesisService {
  constructor(
    private prisma: PrismaService,
    private pppGate: PppGateService,
    private notificaciones: NotificacionesService,
    private configService: ConfigService,
  ) {}

  async findAll(filters?: {
    estado?: string;
    escuela_id?: number;
    asesor_id?: number;
  }) {
    const where: any = {};

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.escuela_id) {
      where.estudiante = {
        escuela_id: filters.escuela_id,
      };
    }

    if (filters?.asesor_id) {
      where.OR = [
        { asesor_principal_id: filters.asesor_id },
        {
          jurados: {
            some: {
              asesor_id: filters.asesor_id,
            },
          },
        },
      ];
    }



    return this.prisma.tesis.findMany({
      where,
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
                id: true,
                nombre: true,
                facultad: true,
              },
            },
          },
        },
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
        _count: {
          select: {
            avances: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findAllByEstudiante(estudiante_id: number) {
    return this.prisma.tesis.findMany({
      where: {
        estudiante_id,
      },
    });
  }

  async findOne(id: number) {
    const tesis = await this.prisma.tesis.findUnique({
      where: { id },
      include: {
        estudiante: {
          include: {
            usuario: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                email: true,
                dni: true,
              },
            },
            escuela: true,
          },
        },
        asesor_principal: {
          include: {
            usuario: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                email: true,
              },
            },
            escuela: true,
          },
        },
        jurados: {
          include: {
            asesor: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombres: true,
                    apellidos: true,
                    email: true,
                  },
                },
              },
            },
            revisiones: { orderBy: { id: 'desc' } },
          },
        },
        avances: {
          orderBy: { fecha_entrega: 'desc' },
        },
        acta: true,
        documentos: {
          orderBy: [{ tipo: 'asc' }, { version: 'desc' }, { subido_en: 'desc' }],
        },
        pagos: { orderBy: { created_at: 'desc' } },
      },
    });

    if (!tesis) {
      throw new NotFoundException(`Tesis con ID ${id} no encontrada`);
    }

    return tesis;
  }

  async create(createTesisDto: CreateTesisDto) {
    await this.pppGate.assertPuedeRegistrarTesis(createTesisDto.estudiante_id);

    // Verificar que el estudiante no tenga ya una tesis activa
    const tesisActiva = await this.prisma.tesis.findFirst({
      where: {
        estudiante_id: createTesisDto.estudiante_id,
        estado: {
          not: 'culminado',
        },
      },
    });

    if (tesisActiva) {
      throw new ConflictException(
        'El estudiante ya tiene una tesis en desarrollo',
      );
    }

    return this.prisma.tesis.create({
      data: {
        ...createTesisDto,
        fecha_inicio: createTesisDto.fecha_inicio
          ? new Date(createTesisDto.fecha_inicio)
          : null,
      },
      include: {
        estudiante: {
          include: {
            usuario: {
              select: {
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
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
    });
  }

  async update(id: number, updateTesisDto: UpdateTesisDto) {
    await this.findOne(id);

    const data: any = { ...updateTesisDto };

    if (updateTesisDto.fecha_inicio) {
      data.fecha_inicio = new Date(updateTesisDto.fecha_inicio);
    }

    if (updateTesisDto.fecha_sustentacion) {
      data.fecha_sustentacion = new Date(updateTesisDto.fecha_sustentacion);
    }

    return this.prisma.tesis.update({
      where: { id },
      data,
    });
  }

  async updateAdmin(id: number, dto: AdminUpdateTesisDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};

    if (dto.titulo !== undefined) data.titulo = dto.titulo;
    if (dto.resumen !== undefined) data.resumen = dto.resumen;
    if (dto.estudiante_id !== undefined) data.estudiante_id = dto.estudiante_id;
    if (dto.asesor_principal_id !== undefined) {
      data.asesor_principal_id = dto.asesor_principal_id;
    }
    if (dto.estado !== undefined) data.estado = dto.estado;
    if (dto.recibo_turnitin_url !== undefined) {
      data.recibo_turnitin_url = dto.recibo_turnitin_url;
    }
    if (dto.similitud_turnitin !== undefined) {
      data.similitud_turnitin = dto.similitud_turnitin;
    }

    const dateField = (key: keyof AdminUpdateTesisDto, val: string | null | undefined) => {
      if (val === undefined) return;
      data[key] = val === null || val === '' ? null : new Date(val);
    };

    dateField('fecha_inicio', dto.fecha_inicio as string | null | undefined);
    dateField(
      'fecha_recepcion_documentos',
      dto.fecha_recepcion_documentos as string | null | undefined,
    );
    dateField(
      'fecha_limite_sustentacion',
      dto.fecha_limite_sustentacion as string | null | undefined,
    );
    dateField('fecha_sustentacion', dto.fecha_sustentacion as string | null | undefined);

    await this.prisma.tesis.update({
      where: { id },
      data: data as any,
    });
    return this.findOne(id);
  }

  async updateEstado(id: number, estado: EstadoTesis) {
    const tesis = await this.findOne(id);

    if (
      tesis.estado === EstadoTesis.culminado &&
      estado !== EstadoTesis.culminado
    ) {
      throw new ConflictException(
        'No se puede revertir una tesis ya culminada.',
      );
    }

    return this.prisma.tesis.update({
      where: { id },
      data: { estado },
    });
  }

  async asignarJurado(id: number, asignarJuradoDto: AsignarJuradoDto[]) {
    const tesis = await this.findOne(id);

    const maxSim = this.configService.get<number>(
      'tesis.similitudMaximaParaJurado',
    ) ?? 25;
    if (
      tesis.similitud_turnitin != null &&
      Number(tesis.similitud_turnitin) > maxSim
    ) {
      throw new HttpException(
        {
          message: `La similitud Turnitin (${Number(tesis.similitud_turnitin)}%) supera el máximo permitido (${maxSim}%) para solicitar jurado.`,
          code: 'TURNITIN_SIMILITUD_ALTA',
        },
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    // Validar que no haya más de 3 jurados
    if (tesis.jurados.length + asignarJuradoDto.length > 3) {
      throw new ConflictException('Máximo 3 jurados permitidos');
    }

    // Validar que el asesor principal no sea jurado
    for (const jurado of asignarJuradoDto) {
      if (jurado.asesor_id === tesis.asesor_principal_id) {
        throw new ConflictException(
          'El asesor principal no puede ser jurado',
        );
      }
    }

    const jurados = await Promise.all(
      asignarJuradoDto.map(async (j) => {
        const jt = await this.prisma.juradoTesis.create({
          data: {
            tesis_id: id,
            asesor_id: j.asesor_id,
            rol: j.rol,
          },
        });
        await this.prisma.revisionJurado.create({
          data: {
            jurado_tesis_id: jt.id,
            estado: EstadoRevisionJurado.pendiente,
            version_documento: 1,
          },
        });
        return jt;
      }),
    );

    const totalJurados = await this.prisma.juradoTesis.count({
      where: { tesis_id: id },
    });
    if (
      totalJurados >= 3 &&
      (tesis.estado === EstadoTesis.desarrollo ||
        tesis.estado === EstadoTesis.propuesta)
    ) {
      await this.prisma.tesis.update({
        where: { id },
        data: { estado: EstadoTesis.en_revision },
      });
    }

    const tesisTitulo = tesis.titulo;
    for (const j of asignarJuradoDto) {
      const asesor = await this.prisma.asesor.findUnique({
        where: { id: j.asesor_id },
        select: { usuario_id: true },
      });
      if (asesor) {
        await this.notificaciones.crearParaUsuario(
          asesor.usuario_id,
          'Asignación a jurado de tesis',
          `Ha sido designado como jurado (${j.rol}) en la tesis: "${tesisTitulo}".`,
          { tesis_id: id, rol_jurado: j.rol },
        );
      }
    }

    return jurados;
  }

  async removerJurado(tesisId: number, juradoId: number) {
    const row = await this.prisma.juradoTesis.findFirst({
      where: { id: juradoId, tesis_id: tesisId },
    });
    if (!row) {
      throw new NotFoundException('Jurado no encontrado en esta tesis');
    }
    return this.prisma.juradoTesis.delete({
      where: { id: juradoId },
    });
  }

  /** Tesis donde el usuario docente figura como jurado, con última revisión y documentos enviados. */
  async listMisAsignacionesJurado(usuarioId: number) {
    const asesor = await this.prisma.asesor.findUnique({
      where: { usuario_id: usuarioId },
      select: { id: true },
    });
    if (!asesor) {
      return [];
    }

    return this.prisma.juradoTesis.findMany({
      where: { asesor_id: asesor.id },
      include: {
        revisiones: { orderBy: { id: 'desc' }, take: 1 },
        tesis: {
          select: {
            id: true,
            titulo: true,
            estado: true,
            similitud_turnitin: true,
            created_at: true,
            estudiante: {
              select: {
                usuario: {
                  select: {
                    nombres: true,
                    apellidos: true,
                    email: true,
                  },
                },
              },
            },
            asesor_principal: {
              select: {
                usuario: {
                  select: { nombres: true, apellidos: true },
                },
              },
            },
            documentos: {
              where: {
                tipo: {
                  in: [
                    TipoDocumentoTesis.tesis_final,
                    TipoDocumentoTesis.version_corregida,
                    TipoDocumentoTesis.anexos,
                  ],
                },
              },
              orderBy: [{ subido_en: 'desc' }],
              take: 8,
              select: {
                id: true,
                tipo: true,
                archivo_url: true,
                nombre_original: true,
                version: true,
                subido_en: true,
                validado: true,
              },
            },
          },
        },
      },
      orderBy: { asignado_en: 'desc' },
    });
  }

  async crearActa(id: number, actaData: {
    fecha: string;
    lugar?: string;
    nota_final?: number;
    archivo_acta_pdf?: string;
    calificaciones_jurado?: object;
  }) {
    const tesis = await this.findOne(id);

    if (tesis.estado !== EstadoTesis.sustentacion_programada) {
      throw new ConflictException(
        'La fecha de sustentación debe estar programada antes de registrar el acta',
      );
    }

    // Verificar que no exista ya un acta
    if (tesis.acta) {
      throw new ConflictException('Ya existe un acta para esta tesis');
    }

    const acta = await this.prisma.actaSustentacion.create({
      data: {
        tesis_id: id,
        fecha: new Date(actaData.fecha),
        lugar: actaData.lugar,
        nota_final: actaData.nota_final,
        archivo_acta_pdf: actaData.archivo_acta_pdf,
        calificaciones_jurado: actaData.calificaciones_jurado as object | undefined,
      },
    });

    // Actualizar estado de la tesis
    await this.prisma.tesis.update({
      where: { id },
      data: {
        estado: EstadoTesis.culminado,
        fecha_sustentacion: new Date(actaData.fecha),
      },
    });

    return acta;
  }

  async getAvances(tesisId: number) {
    await this.findOne(tesisId);

    return this.prisma.avanceTesis.findMany({
      where: { tesis_id: tesisId },
      orderBy: { fecha_entrega: 'desc' },
    });
  }

  async registrarAvance(tesisId: number, createAvanceDto: CreateAvanceDto) {
    const tesis = await this.findOne(tesisId);

    const tipoTurnitin =
      this.configService.get<string>('tesis.tipoAvanceBorradorTurnitin') ??
      'borrador_turnitin';

    if (createAvanceDto.tipo === tipoTurnitin) {
      if (!tesis.recibo_turnitin_url || !tesis.recibo_turnitin_cargado_en) {
        throw new HttpException(
          {
            message:
              'Debe cargar el comprobante/recibo de pago de Turnitin antes de subir el borrador.',
            code: 'TURNITIN_RECIBO_REQUERIDO',
          },
          HttpStatus.PRECONDITION_FAILED,
        );
      }
    }

    return this.prisma.avanceTesis.create({
      data: {
        ...createAvanceDto,
        tesis_id: tesisId,
        fecha_entrega: new Date(createAvanceDto.fecha_entrega),
      },
    });
  }

  async registrarReciboTurnitin(
    tesisId: number,
    reciboUrl: string,
    estudianteId: number,
  ) {
    const tesis = await this.findOne(tesisId);
    if (tesis.estudiante_id !== estudianteId) {
      throw new ForbiddenException(
        'No puede actualizar una tesis ajena.',
      );
    }

    return this.prisma.tesis.update({
      where: { id: tesisId },
      data: {
        recibo_turnitin_url: reciboUrl,
        recibo_turnitin_cargado_en: new Date(),
      },
    });
  }

  async registrarSimilitudTurnitin(
    tesisId: number,
    porcentaje: number,
    usuarioId: number,
    rolesNombres: string[],
  ) {
    const tesis = await this.findOne(tesisId);
    const asesor = await this.prisma.asesor.findUnique({
      where: { usuario_id: usuarioId },
    });

    const puedeCoordinacion =
      rolesNombres.includes('admin') || rolesNombres.includes('coordinador');
    const puedeAsesor =
      asesor != null && asesor.id === tesis.asesor_principal_id;

    if (!puedeCoordinacion && !puedeAsesor) {
      throw new ForbiddenException(
        'Solo el asesor principal o coordinación puede registrar el porcentaje de similitud.',
      );
    }

    return this.prisma.tesis.update({
      where: { id: tesisId },
      data: {
        similitud_turnitin: porcentaje,
        similitud_registrada_en: new Date(),
        similitud_registrada_por_asesor_id: asesor?.id ?? null,
      },
    });
  }

  async getEstadisticas() {
    const total = await this.prisma.tesis.count();

    const porEstado = await this.prisma.tesis.groupBy({
      by: ['estado'],
      _count: { id: true },
    });

    const tesisRecientes = await this.prisma.tesis.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        estudiante: {
          include: {
            usuario: {
              select: {
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
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
    });

    return {
      total_tesis: total,
      por_estado: porEstado.reduce((acc, curr) => {
        acc[curr.estado] = curr._count.id;
        return acc;
      }, {}),
      tesis_recientes: tesisRecientes,
    };
  }

  async subirDocumentoTesis(
    tesisId: number,
    dto: SubirDocumentoTesisDto,
    usuarioId: number,
  ) {
    const tesis = await this.findOne(tesisId);
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { usuario_id: usuarioId },
    });
    if (!estudiante || estudiante.id !== tesis.estudiante_id) {
      throw new ForbiddenException('Solo el tesista puede adjuntar estos documentos.');
    }

    let version = dto.version;
    if (version == null) {
      const agg = await this.prisma.documentoTesis.aggregate({
        where: { tesis_id: tesisId, tipo: dto.tipo },
        _max: { version: true },
      });
      version = (agg._max.version ?? 0) + 1;
    }

    const doc = await this.prisma.documentoTesis.create({
      data: {
        tesis_id: tesisId,
        tipo: dto.tipo,
        archivo_url: dto.archivo_url,
        nombre_original: dto.nombre_original,
        version,
        subido_por: usuarioId,
      },
    });

    const dataTesis: Record<string, unknown> = {};

    if (
      dto.tipo === TipoDocumentoTesis.tesis_final &&
      !tesis.fecha_recepcion_documentos
    ) {
      dataTesis.fecha_recepcion_documentos = new Date();
    }

    if (dto.tipo === TipoDocumentoTesis.version_corregida) {
      dataTesis.estado = EstadoTesis.observaciones_levantadas;
      await this.prisma.revisionJurado.updateMany({
        where: { jurado_tesis: { tesis_id: tesisId } },
        data: {
          conforme: false,
          estado: EstadoRevisionJurado.pendiente,
          revisado_en: null,
          version_documento: { increment: 1 },
        },
      });
    }

    if (Object.keys(dataTesis).length > 0) {
      await this.prisma.tesis.update({
        where: { id: tesisId },
        data: dataTesis as { estado?: EstadoTesis; fecha_recepcion_documentos?: Date },
      });
    }

    return doc;
  }

  async crearPagoTesis(tesisId: number, dto: CrearPagoTesisDto) {
    await this.findOne(tesisId);

    return this.prisma.pagoTesis.create({
      data: {
        tesis_id: tesisId,
        tipo: dto.tipo,
        monto: dto.monto,
        estado: EstadoPago.pendiente,
        observaciones: dto.observaciones,
      },
    });
  }

  /** Solicitud de pago por el tesista (mismo efecto que obligación inicial: pendiente de comprobante). */
  async solicitudPagoTesisPorEstudiante(
    tesisId: number,
    dto: CrearPagoTesisDto,
    usuarioId: number,
  ) {
    const tesis = await this.findOne(tesisId);
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { usuario_id: usuarioId },
    });
    if (!estudiante || estudiante.id !== tesis.estudiante_id) {
      throw new ForbiddenException('Solo el tesista puede registrar solicitudes de pago.');
    }
    const duplicado = await this.prisma.pagoTesis.findFirst({
      where: {
        tesis_id: tesisId,
        tipo: dto.tipo,
        estado: EstadoPago.pendiente,
      },
    });
    if (duplicado) {
      throw new ConflictException(
        'Ya existe una solicitud pendiente para ese concepto. Adjunte el comprobante o espere revisión.',
      );
    }

    const obs = dto.observaciones?.trim()
      ? `[Solicitud estudiante] ${dto.observaciones.trim()}`
      : '[Solicitud estudiante]';

    return this.prisma.pagoTesis.create({
      data: {
        tesis_id: tesisId,
        tipo: dto.tipo,
        monto: dto.monto,
        estado: EstadoPago.pendiente,
        observaciones: obs,
      },
    });
  }

  /** Pagos pendientes/atención y documentos de tesis sin validar administrativamente. */
  async colaSecretariaPagosDocumentos() {
    const estudianteUsuarioSelect = {
      select: {
        nombres: true,
        apellidos: true,
        email: true,
      },
    };
    const tesisSelectBase = {
      select: {
        id: true,
        titulo: true,
        estudiante: {
          select: {
            id: true,
            usuario: estudianteUsuarioSelect,
          },
        },
      },
    };

    const [pagos_atencion, documentos_sin_validar] = await Promise.all([
      this.prisma.pagoTesis.findMany({
        where: {
          estado: {
            in: [EstadoPago.pendiente, EstadoPago.comprobante_cargado],
          },
        },
        include: { tesis: tesisSelectBase },
        orderBy: { created_at: 'desc' },
        take: 200,
      }),
      this.prisma.documentoTesis.findMany({
        where: { validado: false },
        include: { tesis: tesisSelectBase },
        orderBy: { subido_en: 'desc' },
        take: 200,
      }),
    ]);

    return { pagos_atencion, documentos_sin_validar };
  }

  async validarDocumentoTesisAdministrativo(
    tesisId: number,
    documentoId: number,
    validadorUsuarioId: number,
    dto: ValidarDocumentoTesisDto,
  ) {
    const doc = await this.prisma.documentoTesis.findFirst({
      where: { id: documentoId, tesis_id: tesisId },
    });
    if (!doc) {
      throw new NotFoundException('Documento no encontrado');
    }

    return this.prisma.documentoTesis.update({
      where: { id: documentoId },
      data: {
        validado: dto.validado,
        validado_por: dto.validado ? validadorUsuarioId : null,
        validado_en: dto.validado ? new Date() : null,
        observaciones: dto.observaciones ?? doc.observaciones ?? undefined,
      },
    });
  }

  async cargarComprobantePagoTesis(
    tesisId: number,
    pagoId: number,
    dto: CargarComprobantePagoDto,
    usuarioId: number,
  ) {
    const tesis = await this.findOne(tesisId);
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { usuario_id: usuarioId },
    });
    if (!estudiante || estudiante.id !== tesis.estudiante_id) {
      throw new ForbiddenException('Solo el tesista puede cargar comprobantes.');
    }

    const pago = await this.prisma.pagoTesis.findFirst({
      where: { id: pagoId, tesis_id: tesisId },
    });
    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    return this.prisma.pagoTesis.update({
      where: { id: pagoId },
      data: {
        comprobante_url: dto.comprobante_url,
        comprobante_subido_en: new Date(),
        estado: EstadoPago.comprobante_cargado,
        observaciones: dto.observaciones ?? pago.observaciones,
      },
    });
  }

  async verificarPagoTesis(
    tesisId: number,
    pagoId: number,
    dto: VerificarPagoTesisDto,
    verificadorUsuarioId: number,
  ) {
    await this.findOne(tesisId);

    const pago = await this.prisma.pagoTesis.findFirst({
      where: { id: pagoId, tesis_id: tesisId },
    });
    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    const nuevoEstado = dto.estado;
    if (
      nuevoEstado !== EstadoPago.verificado &&
      nuevoEstado !== EstadoPago.rechazado
    ) {
      throw new ConflictException(
        'La verificación administrativa solo puede marcar verificado o rechazado.',
      );
    }

    return this.prisma.pagoTesis.update({
      where: { id: pagoId },
      data: {
        estado: nuevoEstado,
        verificado_por:
          nuevoEstado === EstadoPago.verificado ? verificadorUsuarioId : null,
        verificado_en:
          nuevoEstado === EstadoPago.verificado ? new Date() : null,
        observaciones: dto.observaciones ?? pago.observaciones,
      },
    });
  }

  async juradoRegistrarObservaciones(
    tesisId: number,
    juradoTesisId: number,
    usuarioId: number,
    dto: RevisionJuradoObservacionesDto,
  ) {
    const tesis = await this.findOne(tesisId);

    const nJurados = await this.prisma.juradoTesis.count({
      where: { tesis_id: tesisId },
    });
    if (nJurados < 3) {
      throw new HttpException(
        {
          message: 'Deben designarse 3 jurados antes de registrar observaciones.',
          code: 'JURADO_INCOMPLETO',
        },
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    const jt = await this.prisma.juradoTesis.findFirst({
      where: { id: juradoTesisId, tesis_id: tesisId },
      include: { asesor: true },
    });
    if (!jt) {
      throw new NotFoundException('Asignación de jurado no encontrada');
    }
    if (jt.asesor.usuario_id !== usuarioId) {
      throw new ForbiddenException('Solo el jurado asignado puede registrar observaciones.');
    }

    const revision = await this.prisma.revisionJurado.findFirst({
      where: { jurado_tesis_id: juradoTesisId },
      orderBy: { id: 'desc' },
    });
    if (!revision) {
      throw new ConflictException('No existe ciclo de revisión para este jurado.');
    }

    await this.prisma.revisionJurado.update({
      where: { id: revision.id },
      data: {
        estado: EstadoRevisionJurado.observaciones,
        observaciones: dto.observaciones,
        archivo_correciones_url: dto.archivo_correciones_url ?? null,
        conforme: false,
        revisado_en: new Date(),
      },
    });

    await this.prisma.tesis.update({
      where: { id: tesisId },
      data: { estado: EstadoTesis.observaciones_emitidas },
    });

    const estudiante = await this.prisma.estudiante.findUnique({
      where: { id: tesis.estudiante_id },
      select: { usuario_id: true },
    });
    if (estudiante) {
      await this.notificaciones.crearParaUsuario(
        estudiante.usuario_id,
        'Observaciones del jurado',
        'Tienes observaciones de los jurados sobre tu tesis.',
        { tesis_id: tesisId, jurado_tesis_id: juradoTesisId },
      );
    }

    return this.prisma.revisionJurado.findUnique({
      where: { id: revision.id },
    });
  }

  async juradoMarcarConforme(
    tesisId: number,
    juradoTesisId: number,
    usuarioId: number,
  ) {
    await this.findOne(tesisId);

    const nJurados = await this.prisma.juradoTesis.count({
      where: { tesis_id: tesisId },
    });
    if (nJurados < 3) {
      throw new HttpException(
        {
          message: 'Deben designarse 3 jurados antes de registrar conformidad.',
          code: 'JURADO_INCOMPLETO',
        },
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    const jt = await this.prisma.juradoTesis.findFirst({
      where: { id: juradoTesisId, tesis_id: tesisId },
      include: { asesor: true },
    });
    if (!jt) {
      throw new NotFoundException('Asignación de jurado no encontrada');
    }
    if (jt.asesor.usuario_id !== usuarioId) {
      throw new ForbiddenException('Solo el jurado asignado puede marcar conformidad.');
    }

    const revision = await this.prisma.revisionJurado.findFirst({
      where: { jurado_tesis_id: juradoTesisId },
      orderBy: { id: 'desc' },
    });
    if (!revision) {
      throw new ConflictException('No existe ciclo de revisión para este jurado.');
    }

    await this.prisma.revisionJurado.update({
      where: { id: revision.id },
      data: {
        estado: EstadoRevisionJurado.conforme,
        conforme: true,
        revisado_en: new Date(),
      },
    });

    const jurados = await this.prisma.juradoTesis.findMany({
      where: { tesis_id: tesisId },
      include: {
        revisiones: { orderBy: { id: 'desc' }, take: 1 },
      },
    });

    const todosConformes =
      jurados.length >= 3 &&
      jurados.every(
        (j) =>
          j.revisiones[0]?.conforme === true &&
          j.revisiones[0]?.estado === EstadoRevisionJurado.conforme,
      );

    if (todosConformes) {
      await this.prisma.tesis.update({
        where: { id: tesisId },
        data: { estado: EstadoTesis.aprobado_jurado },
      });
    }

    return this.prisma.revisionJurado.findUnique({
      where: { id: revision.id },
    });
  }

  async construirChecklistCierre(tesisId: number) {
    const tesis = await this.findOne(tesisId);

    const practicasOk = await this.pppGate.practicasAprobadas(tesis.estudiante_id);

    const tieneDocFinal = await this.prisma.documentoTesis.findFirst({
      where: {
        tesis_id: tesisId,
        tipo: TipoDocumentoTesis.tesis_final,
      },
    });

    const pagos = await this.prisma.pagoTesis.findMany({
      where: { tesis_id: tesisId },
    });

    const pagosOk =
      pagos.length > 0 &&
      pagos.every((p) => p.estado === EstadoPago.verificado);

    const juradoOk = tesis.estado === EstadoTesis.aprobado_jurado;

    const motivos: string[] = [];
    if (!practicasOk) motivos.push('Prácticas no constan como aprobadas.');
    if (!juradoOk) motivos.push('El jurado no ha cerrado con conformidad.');
    if (!tieneDocFinal) motivos.push('Falta registrar la tesis final.');
    if (!pagosOk) motivos.push('Existen pagos pendientes de verificación.');
    if ((await this.prisma.juradoTesis.count({ where: { tesis_id: tesisId } })) < 3) {
      motivos.push('Deben asignarse 3 jurados.');
    }

    return {
      completo: motivos.length === 0,
      motivos,
      detalle: {
        practicas_ok: practicasOk,
        jurado_ok: juradoOk,
        documento_final_ok: !!tieneDocFinal,
        pagos_ok: pagosOk,
      },
    };
  }

  async validarExpedito(tesisId: number) {
    const checklist = await this.construirChecklistCierre(tesisId);
    if (!checklist.completo) {
      throw new HttpException(
        {
          message: 'No se cumplen los requisitos para declarar la tesis expedita.',
          motivos: checklist.motivos,
          detalle: checklist.detalle,
          code: 'TESIS_CIERRE_INCOMPLETO',
        },
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    return this.prisma.tesis.update({
      where: { id: tesisId },
      data: { estado: EstadoTesis.expedito },
    });
  }

  async gateProgramarSustentacion(tesisId: number) {
    const tesis = await this.findOne(tesisId);
    const practicasOk = await this.pppGate.practicasAprobadas(tesis.estudiante_id);

    const motivos: string[] = [];
    if (!practicasOk) {
      motivos.push('Las prácticas deben estar en estado APROBADO.');
    }
    if (tesis.estado !== EstadoTesis.expedito) {
      motivos.push(
        'La validación final de documentos y pagos debe estar completa (estado expedito).',
      );
    }

    return {
      permitido: motivos.length === 0,
      motivos,
      practicas_aprobadas: practicasOk,
      estado_tesis: tesis.estado,
    };
  }

  async programarSustentacion(tesisId: number, fechaIso: string) {
    const gate = await this.gateProgramarSustentacion(tesisId);
    if (!gate.permitido) {
      throw new HttpException(
        {
          message: 'No se puede programar la sustentación.',
          motivos: gate.motivos,
          code: 'SUSTENTACION_GATE',
        },
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    const fecha = new Date(fechaIso);
    return this.prisma.tesis.update({
      where: { id: tesisId },
      data: {
        fecha_sustentacion: fecha,
        estado: EstadoTesis.sustentacion_programada,
      },
    });
  }
}