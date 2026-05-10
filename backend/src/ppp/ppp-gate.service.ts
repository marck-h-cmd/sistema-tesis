import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface HabilitacionTesisDetalle {
  puede_registrar_tesis: boolean;
  motivos: string[];
  tiene_resolucion_facultad: boolean;
  tiene_practica_aprobada: boolean;
}

@Injectable()
export class PppGateService {
  constructor(private prisma: PrismaService) {}

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
      };
    }

    const motivos: string[] = [];
    const tieneResolucion = !!estudiante.resolucion_practicas?.trim();

    if (!tieneResolucion) {
      motivos.push(
        'Falta registrar el número de Resolución de Facultad que cierra el módulo de prácticas.',
      );
    }

    const practicaAprobada = await this.prisma.postulacion.findFirst({
      where: {
        estudiante_id: estudianteId,
        estado: 'finalizado',
        seguimiento: { evaluacion: 'aprobado' },
      },
    });

    if (!practicaAprobada) {
      motivos.push(
        'No consta una práctica preprofesional finalizada y aprobada.',
      );
    }

    return {
      puede_registrar_tesis: motivos.length === 0,
      motivos,
      tiene_resolucion_facultad: tieneResolucion,
      tiene_practica_aprobada: !!practicaAprobada,
    };
  }

  async assertPuedeRegistrarTesis(estudianteId: number): Promise<void> {
    const detalle = await this.getDetalleHabilitacionTesis(estudianteId);
    if (!detalle.puede_registrar_tesis) {
      throw new HttpException(
        {
          message:
            'Precondición no cumplida: no se puede registrar tesis sin PPP cerrada y aprobada.',
          motivos: detalle.motivos,
          code: 'TESIS_PPP_GATE',
        },
        HttpStatus.PRECONDITION_FAILED,
      );
    }
  }

  /** Indica si el alumno puede usar el resto del sistema más allá del módulo PPP (tesis, etc.). */
  async moduloTesisDesbloqueado(estudianteId: number): Promise<boolean> {
    const d = await this.getDetalleHabilitacionTesis(estudianteId);
    return d.puede_registrar_tesis;
  }
}
