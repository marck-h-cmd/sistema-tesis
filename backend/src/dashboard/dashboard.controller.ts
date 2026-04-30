import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumen')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getResumen() {
    const resumen = await this.dashboardService.getResumenGeneral();
    return { data: resumen };
  }

  @Get('practicas')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getEstadisticasPracticas() {
    const estadisticas = await this.dashboardService.getEstadisticasPracticas();
    return { data: estadisticas };
  }

  @Get('tesis')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getEstadisticasTesis() {
    const estadisticas = await this.dashboardService.getEstadisticasTesis();
    return { data: estadisticas };
  }

  @Get('empresas')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getEstadisticasEmpresas() {
    const estadisticas = await this.dashboardService.getEstadisticasEmpresas();
    return { data: estadisticas };
  }

  @Get('indicadores')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getIndicadores() {
    const indicadores = await this.dashboardService.getIndicadoresRendimiento();
    return { data: indicadores };
  }

  @Get('completo')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getDashboardCompleto() {
    const [resumen, practicas, tesis, empresas, indicadores] = await Promise.all([
      this.dashboardService.getResumenGeneral(),
      this.dashboardService.getEstadisticasPracticas(),
      this.dashboardService.getEstadisticasTesis(),
      this.dashboardService.getEstadisticasEmpresas(),
      this.dashboardService.getIndicadoresRendimiento(),
    ]);

    return {
      data: {
        resumen,
        practicas,
        tesis,
        empresas,
        indicadores,
      },
    };
  }
}