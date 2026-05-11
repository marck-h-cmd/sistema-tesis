import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PracticasService } from '../practicas/practicas.service';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';
import { UpdateSeguimientoDto } from './dto/update-seguimiento.dto';
import { CreateReporteMensualDto } from './dto/create-reporte-mensual.dto';
import { ValidarReporteMensualDto } from './dto/validar-reporte-mensual.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolNombre } from '@prisma/client';

/**
 * Rutas históricas `/seguimiento`. El identificador `:id` es el **ID de Practica** (modelo `Practica`).
 */
@Controller('seguimiento')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeguimientoController {
  constructor(private readonly practicas: PracticasService) {}

  @Get()
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async findAll(
    @Query('estado') estado?: string,
    @Query('asesor_id') asesor_id?: string,
  ) {
    const rows = await this.practicas.findAll({
      estado,
      asesor_id: asesor_id ? +asesor_id : undefined,
    });
    return { data: rows };
  }

  @Get('estadisticas')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getEstadisticas() {
    const estadisticas = await this.practicas.getEstadisticasHoras();
    return { data: estadisticas };
  }

  @Get('reporte/estudiante/:estudianteId')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.estudiante)
  async getReporteEstudiante(@Param('estudianteId') estudianteId: string) {
    const reporte = await this.practicas.getReportePorEstudiante(+estudianteId);
    return { data: reporte };
  }

  @Post(':id/reportes-mensuales')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
  async registrarReporteMensual(
    @Param('id') id: string,
    @Body() dto: CreateReporteMensualDto,
    @CurrentUser() user: { id: number; roles?: string[] },
  ) {
    if (user.roles?.includes(RolNombre.estudiante)) {
      await this.practicas.assertEsEstudiantePractica(+id, user.id);
    }
    const row = await this.practicas.registrarReporteMensual(+id, dto);
    return { data: row, message: 'Reporte mensual registrado' };
  }

  @Get(':id/reportes-mensuales')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
  async listarReportesMensuales(@Param('id') id: string) {
    const rows = await this.practicas.listarReportesMensuales(+id);
    return { data: rows };
  }

  @Put(':id/reportes-mensuales/:reporteId/validar')
  @Roles(
    RolNombre.asesor,
    RolNombre.admin,
    RolNombre.coordinador,
    RolNombre.secretaria,
  )
  async validarReporteMensual(
    @Param('id') id: string,
    @Param('reporteId') reporteId: string,
    @Body() dto: ValidarReporteMensualDto,
    @CurrentUser() user: { id: number; roles?: string[] },
  ) {
    const row = await this.practicas.validarReporteMensual(
      +id,
      +reporteId,
      user.id,
      dto,
      user.roles,
    );
    return { data: row, message: 'Reporte mensual actualizado' };
  }

  @Post(':id/solicitar-revision-informe-final')
  @Roles(RolNombre.estudiante)
  async solicitarRevisionInformeFinal(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    await this.practicas.assertEsEstudiantePractica(+id, user.id);
    const seg = await this.practicas.solicitarRevisionInformeFinal(+id);
    return {
      data: seg,
      message: 'Trámite de informe final registrado',
    };
  }

  @Post()
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async create(@Body() createSeguimientoDto: CreateSeguimientoDto) {
    const seguimiento = await this.practicas.create(createSeguimientoDto);
    return { data: seguimiento, message: 'Práctica registrada exitosamente' };
  }

  @Put(':id/horas')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async updateHoras(
    @Param('id') id: string,
    @Body('horas') horas: number,
    @Body('tipo') tipo: 'sumar' | 'restar',
  ) {
    const seguimiento = await this.practicas.updateHoras(+id, horas, tipo);
    return { data: seguimiento, message: 'Horas actualizadas exitosamente' };
  }

  @Put(':id/informes')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
  async updateInformes(
    @Param('id') id: string,
    @Body() updateSeguimientoDto: UpdateSeguimientoDto,
    @CurrentUser() user: { id: number; roles?: string[] },
  ) {
    if (user.roles?.includes(RolNombre.estudiante)) {
      await this.practicas.assertEsEstudiantePractica(+id, user.id);
    }
    const seguimiento = await this.practicas.updateInformes(
      +id,
      updateSeguimientoDto,
    );
    return { data: seguimiento, message: 'Informes actualizados exitosamente' };
  }

  @Put(':id/evaluar')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async evaluar(
    @Param('id') id: string,
    @Body('evaluacion') evaluacion: string,
    @Body('observaciones') observaciones?: string,
  ) {
    const seguimiento = await this.practicas.evaluarPractica(
      +id,
      evaluacion,
      observaciones,
    );
    return {
      data: seguimiento,
      message: `Práctica evaluada como: ${evaluacion}`,
    };
  }

  @Get(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
  async findOne(@Param('id') id: string) {
    const seguimiento = await this.practicas.findOne(+id);
    return { data: seguimiento };
  }
}
