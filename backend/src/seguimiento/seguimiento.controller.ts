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
import { SeguimientoService } from './seguimiento.service';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';
import { UpdateSeguimientoDto } from './dto/update-seguimiento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '@prisma/client';

@Controller('seguimiento')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeguimientoController {
  constructor(private readonly seguimientoService: SeguimientoService) {}

  @Get()
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async findAll(
    @Query('estado') estado?: string,
    @Query('asesor_id') asesor_id?: string,
  ) {
    const seguimientos = await this.seguimientoService.findAll({
      estado,
      asesor_id: asesor_id ? +asesor_id : undefined,
    });
    return { data: seguimientos };
  }

  @Get('estadisticas')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getEstadisticas() {
    const estadisticas = await this.seguimientoService.getEstadisticasHoras();
    return { data: estadisticas };
  }

  @Get(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
  async findOne(@Param('id') id: string) {
    const seguimiento = await this.seguimientoService.findOne(+id);
    return { data: seguimiento };
  }

  @Post()
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async create(@Body() createSeguimientoDto: CreateSeguimientoDto) {
    const seguimiento = await this.seguimientoService.create(createSeguimientoDto);
    return { data: seguimiento, message: 'Seguimiento creado exitosamente' };
  }

  @Put(':id/horas')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async updateHoras(
    @Param('id') id: string,
    @Body('horas') horas: number,
    @Body('tipo') tipo: 'sumar' | 'restar',
  ) {
    const seguimiento = await this.seguimientoService.updateHoras(+id, horas, tipo);
    return { data: seguimiento, message: 'Horas actualizadas exitosamente' };
  }

  @Put(':id/informes')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
  async updateInformes(
    @Param('id') id: string,
    @Body() updateSeguimientoDto: UpdateSeguimientoDto,
  ) {
    const seguimiento = await this.seguimientoService.updateInformes(
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
    const seguimiento = await this.seguimientoService.evaluarPractica(
      +id,
      evaluacion,
      observaciones,
    );
    return {
      data: seguimiento,
      message: `Práctica evaluada como: ${evaluacion}`,
    };
  }

  @Get('reporte/estudiante/:estudianteId')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.estudiante)
  async getReporteEstudiante(@Param('estudianteId') estudianteId: string) {
    const reporte = await this.seguimientoService.getReportePorEstudiante(
      +estudianteId,
    );
    return { data: reporte };
  }
}