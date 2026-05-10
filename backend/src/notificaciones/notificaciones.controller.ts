import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolNombre } from '@prisma/client';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  @Roles(
    RolNombre.admin,
    RolNombre.coordinador,
    RolNombre.asesor,
    RolNombre.estudiante,
    RolNombre.empresa,
  )
  async listar(
    @CurrentUser() user: { id: number },
    @Query('solo_no_leidas') solo_no_leidas?: string,
  ) {
    const data = await this.notificacionesService.listarPorUsuario(
      user.id,
      solo_no_leidas === '1' || solo_no_leidas === 'true',
    );
    return { data };
  }

  @Patch(':id/leida')
  @Roles(
    RolNombre.admin,
    RolNombre.coordinador,
    RolNombre.asesor,
    RolNombre.estudiante,
    RolNombre.empresa,
  )
  async marcarLeida(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    await this.notificacionesService.marcarLeida(+id, user.id);
    return { message: 'Notificación marcada como leída' };
  }
}
