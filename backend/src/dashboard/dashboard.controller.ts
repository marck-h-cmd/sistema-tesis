import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '../common/enums/enums';  // ✅ cambiado

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumen')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getResumen() {
    return { data: await this.dashboardService.getResumenGeneral() };
  }

  @Get('practicas')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getEstadisticasPracticas() {
    return { data: await this.dashboardService.getEstadisticasPracticas() };
  }

  @Get('tesis')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getEstadisticasTesis() {
    return { data: await this.dashboardService.getEstadisticasTesis() };
  }

  @Get('empresas')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getEstadisticasEmpresas() {
    return { data: await this.dashboardService.getEstadisticasEmpresas() };
  }

  @Get('indicadores')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getIndicadores() {
    return { data: await this.dashboardService.getIndicadoresRendimiento() };
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
    return { data: { resumen, practicas, tesis, empresas, indicadores } };
  }
}