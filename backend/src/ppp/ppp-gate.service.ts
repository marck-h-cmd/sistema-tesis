import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EstadoPractica } from '@prisma/client';

export interface HabilitacionTesisDetalle {
  puede_registrar_tesis: boolean;
  motivos: string[];
  tiene_resolucion_facultad: boolean;
  tiene_practica_aprobada: boolean;
  practicas_status: EstadoPractica | null;
}

@Injectable()
export class PppGateService {
  constructor(private prisma: PrismaService) {}

  async getPracticaCierreParaEstudiante(estudianteId: number) {
    return this.prisma.practica.findFirst({
      where: {
        estudiante_id: estudianteId,
        estado: EstadoPractica.aprobado,
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async getDetalleHabilitacionTesis(
    estudianteId: number,
  ): Promise<HabilitacionTesisDetalle> {
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { id: estudianteId },
    });

    if (!estudiante) {
      return {
        puede_registrar_tesis: false,
        motivos: ['Estudiante no encontrado.'],
        tiene_resolucion_facultad: false,
        tiene_practica_aprobada: false,
        practicas_status: null,
      };
    }

    const motivos: string[] = [];

    const practicaAprobada = await this.prisma.practica.findFirst({
      where: {
        estudiante_id: estudianteId,
        estado: EstadoPractica.aprobado,
      },
      orderBy: { updated_at: 'desc' },
    });

    const practicaMasReciente = await this.prisma.practica.findFirst({
      where: { estudiante_id: estudianteId },
      orderBy: { updated_at: 'desc' },
    });

    if (!practicaAprobada) {
      motivos.push(
        'Las prácticas preprofesionales deben estar aprobadas (informe final firmado por el asesor) antes de registrar tesis.',
      );
    }

    const tieneResolucion = !!practicaAprobada?.resolucion_url?.trim();

    return {
      puede_registrar_tesis: motivos.length === 0,
      motivos,
      tiene_resolucion_facultad: tieneResolucion,
      tiene_practica_aprobada: !!practicaAprobada,
      practicas_status: practicaMasReciente?.estado ?? null,
    };
  }

  async assertPuedeRegistrarTesis(estudianteId: number): Promise<void> {
    const detalle = await this.getDetalleHabilitacionTesis(estudianteId);
    if (!detalle.puede_registrar_tesis) {
      throw new HttpException(
        {
          message:
            'Precondición no cumplida: no se puede registrar tesis sin prácticas aprobadas.',
          motivos: detalle.motivos,
          practicas_status: detalle.practicas_status,
          code: 'TESIS_PPP_GATE',
        },
        HttpStatus.PRECONDITION_FAILED,
      );
    }
  }

  async moduloTesisDesbloqueado(estudianteId: number): Promise<boolean> {
    const d = await this.getDetalleHabilitacionTesis(estudianteId);
    return d.puede_registrar_tesis;
  }

  /** Equivalente de negocio a `practicas_status === APROBADO` para habilitar sustentación. */
  async practicasAprobadas(estudianteId: number): Promise<boolean> {
    const row = await this.prisma.practica.findFirst({
      where: { estudiante_id: estudianteId, estado: EstadoPractica.aprobado },
    });
    return !!row;
  }
}
