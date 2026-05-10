import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PracticasService } from './practicas.service';
import { SubirArchivoPracticaDto } from './dto/subir-archivo-practica.dto';
import { ValidarPlanDto } from './dto/validar-plan.dto';
import { AprobarInformeDto } from './dto/aprobar-informe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolNombre } from '@prisma/client';

@Controller('practicas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PracticasController {
  constructor(private readonly practicas: PracticasService) {}

  @Get('estudiante/:estudianteId')
  @Roles(
    RolNombre.admin,
    RolNombre.coordinador,
    RolNombre.secretaria,
    RolNombre.asesor,
    RolNombre.estudiante,
  )
  async listByEstudiante(@Param('estudianteId') estudianteId: string) {
    const rows = await this.practicas.findByEstudiante(+estudianteId);
    return { data: rows };
  }

  @Get('postulacion/:postulacionId')
  @Roles(
    RolNombre.admin,
    RolNombre.coordinador,
    RolNombre.secretaria,
    RolNombre.asesor,
    RolNombre.estudiante,
  )
  async byPostulacion(@Param('postulacionId') postulacionId: string) {
    const row = await this.practicas.findByPostulacion(+postulacionId);
    return { data: row };
  }

  @Get(':id')
  @Roles(
    RolNombre.admin,
    RolNombre.coordinador,
    RolNombre.secretaria,
    RolNombre.asesor,
    RolNombre.estudiante,
  )
  async findOne(@Param('id') id: string) {
    const row = await this.practicas.findOne(+id);
    return { data: row };
  }

  @Put(':id/plan')
  @Roles(RolNombre.estudiante)
  async subirPlan(
    @Param('id') id: string,
    @Body() dto: SubirArchivoPracticaDto,
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.practicas.subirPlanPracticas(
      +id,
      dto.archivo_url,
      dto.nombre_original,
      user.id,
    );
    return { data: row, message: 'Plan de prácticas registrado' };
  }

  @Put(':id/plan/validar')
  @Roles(RolNombre.secretaria, RolNombre.admin)
  async validarPlan(
    @Param('id') id: string,
    @Body() dto: ValidarPlanDto,
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.practicas.validarPlanAdministrativo(+id, user.id, dto);
    return { data: row, message: dto.aprobado ? 'Plan validado' : 'Plan observado' };
  }

  @Put(':id/informe-final')
  @Roles(RolNombre.estudiante, RolNombre.asesor)
  async informeFinal(
    @Param('id') id: string,
    @Body() dto: SubirArchivoPracticaDto,
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.practicas.registrarInformeFinal(
      +id,
      dto.archivo_url,
      dto.nombre_original,
      user.id,
    );
    return { data: row, message: 'Informe final registrado' };
  }

  @Put(':id/informe-final/acta')
  @Roles(RolNombre.asesor)
  async actaAsesor(
    @Param('id') id: string,
    @Body() dto: SubirArchivoPracticaDto,
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.practicas.registrarActaAprobacionAsesor(
      +id,
      dto.archivo_url,
      dto.nombre_original,
      user.id,
    );
    return { data: row, message: 'Acta cargada' };
  }

  @Put(':id/informe-final/aprobar')
  @Roles(RolNombre.asesor)
  async aprobarInforme(
    @Param('id') id: string,
    @Body() dto: AprobarInformeDto,
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.practicas.aprobarInformeFinal(+id, user.id, dto);
    return { data: row, message: 'Informe final aprobado — práctica cerrada' };
  }

  @Put(':id/resolucion-facultad')
  @Roles(RolNombre.admin, RolNombre.secretaria, RolNombre.coordinador)
  async resolucionFacultad(
    @Param('id') id: string,
    @Body()
    body: { archivo_url: string; numero?: string },
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.practicas.cargarResolucionFacultad(+id, user.id, body);
    return { data: row, message: 'Resolución registrada' };
  }

  @Put(':id/solicitar-revision-informe-final')
  @Roles(RolNombre.estudiante)
  async solicitarRevisionInformeFinal(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    await this.practicas.assertEsEstudiantePractica(+id, user.id);
    const row = await this.practicas.solicitarRevisionInformeFinal(+id);
    return { data: row, message: 'Trámite de informe final iniciado' };
  }
}
