import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getResumenGeneral() {
    const [
      totalEstudiantes,
      totalEmpresas,
      totalOfertasActivas,
      totalPostulaciones,
      totalTesisActivas,
      totalAsesores,
    ] = await Promise.all([
      this.prisma.estudiante.count(),
      this.prisma.empresa.count(),
      this.prisma.ofertaPractica.count({ where: { estado: 'abierta' } }),
      this.prisma.postulacion.count({
        where: { estado: { in: ['postulado', 'aceptado', 'en_curso'] } },
      }),
      this.prisma.tesis.count({ where: { estado: { not: 'culminado' } } }),
      this.prisma.asesor.count(),
    ]);

    return {
      total_estudiantes: totalEstudiantes,
      total_empresas: totalEmpresas,
      total_ofertas_activas: totalOfertasActivas,
      total_postulaciones_activas: totalPostulaciones,
      total_tesis_activas: totalTesisActivas,
      total_asesores: totalAsesores,
    };
  }

async getEstadisticasPracticas() {
  const practicasPorEstado = await this.prisma.postulacion.groupBy({
    by: ['estado'],
    _count: { id: true },
  });

  const estudiantesPorEscuela = await this.prisma.estudiante.groupBy({
    by: ['escuela_id'],
    _count: { id: true },
  });

  const escuelas = await this.prisma.escuela.findMany({
    where: { id: { in: estudiantesPorEscuela.map((e) => e.escuela_id) } },
    select: { id: true, nombre: true },
  });

  // ✅ Fixed: Add parentheses around the return type
  const practicasPorMes = await this.prisma.$queryRaw<{ mes: string; total: bigint }[]>`
    SELECT 
      TO_CHAR(fecha_postulacion, 'YYYY-MM') as mes,
      COUNT(*) as total
    FROM postulacion
    GROUP BY mes
    ORDER BY mes DESC
    LIMIT 6
  `;

  return {
    practicas_por_estado: practicasPorEstado.map((e) => ({
      estado: e.estado,
      total: e._count.id,
    })),
    estudiantes_por_escuela: estudiantesPorEscuela.map((e) => ({
      escuela_id: e.escuela_id,
      escuela: escuelas.find((esc) => esc.id === e.escuela_id)?.nombre || 'Desconocido',
      total: e._count.id,
    })),
    practicas_por_mes: practicasPorMes.map((r) => ({
      mes: r.mes,
      total: Number(r.total), // ✅ BigInt → Number
    })),
  };
}

 async getEstadisticasTesis() {
  const tesisPorEstado = await this.prisma.tesis.groupBy({
    by: ['estado'],
    _count: { id: true },
  });

  // ✅ Fixed: Add parentheses around the return type
  const tesisPorEscuela = await this.prisma.$queryRaw<{ escuela: string; total: bigint }[]>`
    SELECT 
      e.nombre as escuela,
      COUNT(t.id) as total
    FROM tesis t
    INNER JOIN estudiante es ON t.estudiante_id = es.id
    INNER JOIN escuela e ON es.escuela_id = e.id
    GROUP BY e.id, e.nombre
    ORDER BY total DESC
  `;

  // ✅ Fixed: Add parentheses around the return type
  const tesisPorAnio = await this.prisma.$queryRaw<{ anio: number; total: bigint }[]>`
    SELECT 
      EXTRACT(YEAR FROM fecha_inicio) as anio,
      COUNT(*) as total
    FROM tesis
    WHERE fecha_inicio IS NOT NULL
    GROUP BY anio
    ORDER BY anio DESC
    LIMIT 5
  `;

  return {
    tesis_por_estado: tesisPorEstado.map((e) => ({
      estado: e.estado,
      total: e._count.id,
    })),
    tesis_por_escuela: tesisPorEscuela.map((r) => ({
      escuela: r.escuela,
      total: Number(r.total), // ✅
    })),
    tesis_por_anio: tesisPorAnio.map((r) => ({
      anio: Number(r.anio),
      total: Number(r.total), // ✅
    })),
  };
}

  async getEstadisticasEmpresas() {
    const empresasConConvenio = await this.prisma.empresa.count({
      where: { convenio_activo: true },
    });
    const empresasSinConvenio = await this.prisma.empresa.count({
      where: { convenio_activo: false },
    });

    const topEmpresas = await this.prisma.ofertaPractica.groupBy({
      by: ['empresa_id'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const empresas = await this.prisma.empresa.findMany({
      where: { id: { in: topEmpresas.map((e) => e.empresa_id) } },
      select: { id: true, razon_social: true },
    });

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 30);

    const conveniosPorVencer = await this.prisma.convenio.findMany({
      where: {
        fecha_fin: { lte: fechaLimite, gte: new Date() },
        estado: 'vigente',
      },
      include: { empresa: { select: { razon_social: true } } },
      orderBy: { fecha_fin: 'asc' },
    });

    return {
      empresas_con_convenio: empresasConConvenio,
      empresas_sin_convenio: empresasSinConvenio,
      top_empresas_ofertas: topEmpresas.map((e) => ({
        empresa: empresas.find((emp) => emp.id === e.empresa_id)?.razon_social || 'Desconocido',
        total_ofertas: e._count.id,
      })),
      convenios_por_vencer: conveniosPorVencer.map((c) => ({
        id: c.id,
        empresa: c.empresa.razon_social,
        fecha_fin: c.fecha_fin,
      })),
    };
  }

  async getIndicadoresRendimiento() {
    const totalPostulaciones = await this.prisma.postulacion.count();
    const postulacionesExitosas = await this.prisma.postulacion.count({
      where: {
        estado: 'finalizado',
        seguimiento: { evaluacion: 'aprobado' },
      },
    });

    const tasaExitoPracticas =
      totalPostulaciones > 0
        ? ((postulacionesExitosas / totalPostulaciones) * 100).toFixed(1)
        : '0';

    const totalTesis = await this.prisma.tesis.count();
    const tesisCulminadas = await this.prisma.tesis.count({
      where: { estado: 'culminado' },
    });

    const tasaCulminacionTesis =
      totalTesis > 0
        ? ((tesisCulminadas / totalTesis) * 100).toFixed(1)
        : '0';

    const tesisConFechas = await this.prisma.tesis.findMany({
      where: {
        fecha_inicio: { not: null },
        fecha_sustentacion: { not: null },
        estado: 'culminado',
      },
      select: { fecha_inicio: true, fecha_sustentacion: true },
    });

    let promedioDuracion = 0;
    if (tesisConFechas.length > 0) {
      const duraciones = tesisConFechas.map((t) => {
        const inicio = new Date(t.fecha_inicio);
        const fin = new Date(t.fecha_sustentacion);
        return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      });
      promedioDuracion = Math.round(
        duraciones.reduce((acc, d) => acc + d, 0) / duraciones.length,
      );
    }

    return {
      tasa_exito_practicas: `${tasaExitoPracticas}%`,
      tasa_culminacion_tesis: `${tasaCulminacionTesis}%`,
      promedio_duracion_tesis_dias: promedioDuracion,
      total_postulaciones: totalPostulaciones,
      postulaciones_exitosas: postulacionesExitosas,
      total_tesis: totalTesis,
      tesis_culminadas: tesisCulminadas,
    };
  }
}