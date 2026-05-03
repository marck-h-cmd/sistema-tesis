import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  HttpStatus,
  UseGuards,
  StreamableFile,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '@prisma/client';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('tesis/:id/documento')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
  async verDocumentoTesis(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdf = await this.reportesService.generarDocumentoTesis(id);
    const fecha = new Date().toISOString().split('T')[0];

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="tesis-${id}-documento-${fecha}.pdf"`,
      'Content-Length': pdf.length.toString(),
    });

    res.end(pdf);
  }

  @Get('tesis/:id/descargar')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
  async descargarDocumentoTesis(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdf = await this.reportesService.generarDocumentoTesis(id);
    const fecha = new Date().toISOString().split('T')[0];

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="tesis-${id}-informe-${fecha}.pdf"`,
      'Content-Length': pdf.length.toString(),
    });

    res.end(pdf);
  }

  @Post('practicas')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async generarReportePracticas(@Res() res: Response) {
    const pdf = await this.reportesService.generarReportePracticas();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-practicas-${new Date().toISOString().split('T')[0]}.pdf"`,
      'Content-Length': pdf.length.toString(),
    });

    res.end(pdf);
  }

  @Post('tesis')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async generarReporteTesis(@Res() res: Response) {
    const pdf = await this.reportesService.generarReporteTesis();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-tesis-${new Date().toISOString().split('T')[0]}.pdf"`,
      'Content-Length': pdf.length.toString(),
    });

    res.end(pdf);
  }

  @Post('empresas')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async generarReporteEmpresas(@Res() res: Response) {
    const pdf = await this.reportesService.generarReporteEmpresas();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-empresas-${new Date().toISOString().split('T')[0]}.pdf"`,
      'Content-Length': pdf.length.toString(),
    });

    res.end(pdf);
  }

  @Get('historial')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getHistorial() {
    const reportes = await this.reportesService.getHistorialReportes();
    return { data: reportes };
  }

  @Get(':id/descargar')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async descargarReporte(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.reportesService.getReporteById(+id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-${id}.pdf"`,
      'Content-Length': pdf.length.toString(),
    });

    res.end(pdf);
  }
}
