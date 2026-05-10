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
import { AsignarJuradoDto } from './dto/asignar-jurado.dto';
import { CreateAvanceDto } from './dto/create-avance.dto';
import { EstadoTesis } from '@prisma/client';
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

  async updateEstado(id: number, estado: EstadoTesis) {
    const tesis = await this.findOne(id);

    // Validar transiciones de estado
    const transicionesValidas = {
      [EstadoTesis.propuesta]: [EstadoTesis.desarrollo],
      [EstadoTesis.desarrollo]: [EstadoTesis.sustentacion, EstadoTesis.propuesta],
      [EstadoTesis.sustentacion]: [EstadoTesis.culminado, EstadoTesis.desarrollo],
      [EstadoTesis.culminado]: [],
    };

    if (!transicionesValidas[tesis.estado].includes(estado)) {
      throw new ConflictException(
        `No se puede cambiar de ${tesis.estado} a ${estado}`,
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
      asignarJuradoDto.map((j) =>
        this.prisma.juradoTesis.create({
          data: {
            tesis_id: id,
            asesor_id: j.asesor_id,
            rol: j.rol,
          },
        }),
      ),
    );

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
    return this.prisma.juradoTesis.delete({
      where: { id: juradoId },
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

    // Verificar que la tesis esté en sustentación
    if (tesis.estado !== 'sustentacion') {
      throw new ConflictException('La tesis debe estar en fase de sustentación');
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
        estado: 'culminado',
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
}