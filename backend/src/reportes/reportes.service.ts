import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  private async generatePDF(htmlContent: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
      });

      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        printBackground: true,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  async generarReportePracticas() {
    // Obtener datos de prácticas
    const practicas = await this.prisma.postulacion.findMany({
      include: {
        estudiante: {
          include: {
            usuario: {
              select: {
                nombres: true,
                apellidos: true,
                dni: true,
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

    const estadisticas = {
      total: practicas.length,
      en_curso: practicas.filter((p) => p.estado === 'en_curso').length,
      finalizadas: practicas.filter((p) => p.estado === 'finalizado').length,
      aprobadas: practicas.filter(
        (p) => p.seguimiento?.evaluacion === 'aprobado',
      ).length,
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #1a365d;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1a365d;
            font-size: 24px;
            margin: 0 0 10px 0;
          }
          .header h2 {
            color: #2d3748;
            font-size: 18px;
            margin: 0;
            font-weight: normal;
          }
          .header .fecha {
            color: #718096;
            font-size: 12px;
            margin-top: 10px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .stat-box {
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          .stat-box .number {
            font-size: 32px;
            font-weight: bold;
            color: #2b6cb0;
          }
          .stat-box .label {
            font-size: 11px;
            color: #718096;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #2b6cb0;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 11px;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
          }
          tr:nth-child(even) {
            background-color: #f7fafc;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
          }
          .badge-success { background-color: #c6f6d5; color: #22543d; }
          .badge-warning { background-color: #fefcbf; color: #744210; }
          .badge-danger { background-color: #fed7d7; color: #742a2a; }
          .badge-info { background-color: #bee3f8; color: #2a4365; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Universidad Nacional de Trujillo</h1>
          <h2>Reporte de Prácticas Preprofesionales</h2>
          <div class="fecha">Generado el ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}</div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="number">${estadisticas.total}</div>
            <div class="label">Total Prácticas</div>
          </div>
          <div class="stat-box">
            <div class="number">${estadisticas.en_curso}</div>
            <div class="label">En Curso</div>
          </div>
          <div class="stat-box">
            <div class="number">${estadisticas.finalizadas}</div>
            <div class="label">Finalizadas</div>
          </div>
          <div class="stat-box">
            <div class="number">${estadisticas.aprobadas}</div>
            <div class="label">Aprobadas</div>
          </div>
        </div>

        <h3 style="color: #2d3748;">Detalle de Prácticas</h3>
        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>DNI</th>
              <th>Escuela</th>
              <th>Empresa</th>
              <th>Horas</th>
              <th>Estado</th>
              <th>Evaluación</th>
            </tr>
          </thead>
          <tbody>
            ${practicas
              .map(
                (p) => `
              <tr>
                <td>${p.estudiante.usuario.apellidos}, ${p.estudiante.usuario.nombres}</td>
                <td>${p.estudiante.usuario.dni}</td>
                <td>${p.estudiante.escuela.nombre}</td>
                <td>${p.oferta.empresa.razon_social}</td>
                <td>${p.seguimiento?.horas_cumplidas || 0} / ${p.seguimiento?.horas_totales || 300}</td>
                <td><span class="badge badge-${p.estado === 'finalizado' ? 'success' : p.estado === 'en_curso' ? 'info' : 'warning'}">${p.estado.replace('_', ' ')}</span></td>
                <td><span class="badge badge-${p.seguimiento?.evaluacion === 'aprobado' ? 'success' : p.seguimiento?.evaluacion === 'desaprobado' ? 'danger' : 'warning'}">${p.seguimiento?.evaluacion || 'pendiente'}</span></td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const pdf = await this.generatePDF(htmlContent);

    // Guardar en la base de datos
    await this.prisma.reporte.create({
      data: {
        tipo: 'practicas',
        archivo_generado: pdf,
        parametros: { fecha_generacion: new Date().toISOString() },
      },
    });

    return pdf;
  }

  async generarReporteTesis() {
    const tesis = await this.prisma.tesis.findMany({
      include: {
        estudiante: {
          include: {
            usuario: {
              select: {
                nombres: true,
                apellidos: true,
              },
            },
            escuela: true,
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
        acta: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const estadisticas = {
      total: tesis.length,
      en_desarrollo: tesis.filter((t) => t.estado === 'desarrollo').length,
      en_sustentacion: tesis.filter((t) => t.estado === 'sustentacion').length,
      culminadas: tesis.filter((t) => t.estado === 'culminado').length,
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #1a365d;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1a365d;
            font-size: 24px;
            margin: 0 0 10px 0;
          }
          .header h2 {
            color: #2d3748;
            font-size: 18px;
            margin: 0;
            font-weight: normal;
          }
          .header .fecha {
            color: #718096;
            font-size: 12px;
            margin-top: 10px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .stat-box {
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          .stat-box .number {
            font-size: 32px;
            font-weight: bold;
            color: #2b6cb0;
          }
          .stat-box .label {
            font-size: 11px;
            color: #718096;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #2b6cb0;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 11px;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
          }
          tr:nth-child(even) {
            background-color: #f7fafc;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
          }
          .badge-success { background-color: #c6f6d5; color: #22543d; }
          .badge-warning { background-color: #fefcbf; color: #744210; }
          .badge-info { background-color: #bee3f8; color: #2a4365; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Universidad Nacional de Trujillo</h1>
          <h2>Reporte de Tesis</h2>
          <div class="fecha">Generado el ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}</div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="number">${estadisticas.total}</div>
            <div class="label">Total Tesis</div>
          </div>
          <div class="stat-box">
            <div class="number">${estadisticas.en_desarrollo}</div>
            <div class="label">En Desarrollo</div>
          </div>
          <div class="stat-box">
            <div class="number">${estadisticas.en_sustentacion}</div>
            <div class="label">En Sustentación</div>
          </div>
          <div class="stat-box">
            <div class="number">${estadisticas.culminadas}</div>
            <div class="label">Culminadas</div>
          </div>
        </div>

        <h3 style="color: #2d3748;">Listado de Tesis</h3>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Estudiante</th>
              <th>Asesor</th>
              <th>Escuela</th>
              <th>Estado</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            ${tesis
              .map(
                (t) => `
              <tr>
                <td>${t.titulo}</td>
                <td>${t.estudiante.usuario.apellidos}, ${t.estudiante.usuario.nombres}</td>
                <td>${t.asesor_principal.usuario.apellidos}, ${t.asesor_principal.usuario.nombres}</td>
                <td>${t.estudiante.escuela.nombre}</td>
                <td><span class="badge badge-${t.estado === 'culminado' ? 'success' : t.estado === 'sustentacion' ? 'warning' : 'info'}">${t.estado}</span></td>
                <td>${t.acta?.nota_final || '-'}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const pdf = await this.generatePDF(htmlContent);

    await this.prisma.reporte.create({
      data: {
        tipo: 'tesis',
        archivo_generado: pdf,
        parametros: { fecha_generacion: new Date().toISOString() },
      },
    });

    return pdf;
  }

  async generarReporteEmpresas() {
    const empresas = await this.prisma.empresa.findMany({
      include: {
        convenios: {
          where: { estado: 'vigente' },
        },
        _count: {
          select: {
            ofertas: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #1a365d;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1a365d;
            font-size: 24px;
            margin: 0 0 10px 0;
          }
          .header h2 {
            color: #2d3748;
            font-size: 18px;
            margin: 0;
            font-weight: normal;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #2b6cb0;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 11px;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
          }
          tr:nth-child(even) {
            background-color: #f7fafc;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Universidad Nacional de Trujillo</h1>
          <h2>Reporte de Empresas Conveniadas</h2>
          <div class="fecha">Generado el ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>RUC</th>
              <th>Razón Social</th>
              <th>Dirección</th>
              <th>Contacto</th>
              <th>Convenio</th>
              <th>Ofertas</th>
            </tr>
          </thead>
          <tbody>
            ${empresas
              .map(
                (e) => `
              <tr>
                <td>${e.ruc}</td>
                <td>${e.razon_social}</td>
                <td>${e.direccion || '-'}</td>
                <td>${e.email_contacto || '-'}</td>
                <td>${e.convenio_activo ? 'Vigente' : 'Sin convenio'}</td>
                <td>${e._count.ofertas}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const pdf = await this.generatePDF(htmlContent);

    await this.prisma.reporte.create({
      data: {
        tipo: 'empresas',
        archivo_generado: pdf,
        parametros: { fecha_generacion: new Date().toISOString() },
      },
    });

    return pdf;
  }

  async getHistorialReportes() {
    return this.prisma.reporte.findMany({
      select: {
        id: true,
        tipo: true,
        parametros: true,
        generado_en: true,
        generado_por: true,
      },
      orderBy: { generado_en: 'desc' },
      take: 20,
    });
  }

  async getReporteById(id: number) {
    const reporte = await this.prisma.reporte.findUnique({
      where: { id },
    });

    if (!reporte || !reporte.archivo_generado) {
      throw new NotFoundException(`Reporte con ID ${id} no encontrado`);
    }

    return reporte.archivo_generado;
  }
}