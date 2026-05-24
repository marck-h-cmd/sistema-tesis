import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PracticasService } from './practicas.service';
import { SubirArchivoPracticaDto } from './dto/subir-archivo-practica.dto';
import { ValidarPlanDto } from './dto/validar-plan.dto';
import { AprobarInformeDto } from './dto/aprobar-informe.dto';
import { UpdatePracticaAdminDto } from './dto/update-practica-admin.dto';
import { ValidarDocumentoPracticaDto } from './dto/validar-documento-practica.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolNombre } from '@prisma/client';

@Controller('practicas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PracticasController {
  constructor(private readonly practicas: PracticasService) {}

  @Get('secretaria/cola')
  @Roles(RolNombre.secretaria, RolNombre.admin, RolNombre.asesor)
  async colaSecretaria() {
    const data = await this.practicas.colaSecretaria();
    return { data };
  }

  @Patch(':id/admin')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async updateAdmin(
    @Param('id') id: string,
    @Body() dto: UpdatePracticaAdminDto,
  ) {
    const row = await this.practicas.updateAdmin(+id, dto);
    return { data: row, message: 'Práctica actualizada' };
  }

  @Put(':id/documentos/:documentoId/validar')
  @Roles(RolNombre.secretaria, RolNombre.admin, RolNombre.asesor)
  async validarDocumento(
    @Param('id') id: string,
    @Param('documentoId') documentoId: string,
    @Body() dto: ValidarDocumentoPracticaDto,
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.practicas.validarDocumentoPractica(
      +id,
      +documentoId,
      user.id,
      dto,
    );
    return { data: row, message: 'Documento actualizado' };
  }

  @Get('estudiante/:estudianteId')
  @Roles(
    RolNombre.admin,
    RolNombre.coordinador,
    RolNombre.secretaria,
    RolNombre.asesor,
    RolNombre.estudiante,
    RolNombre.empresa,
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
    RolNombre.empresa,
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
    RolNombre.empresa,
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
  @Roles(RolNombre.secretaria, RolNombre.admin, RolNombre.asesor)
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
  @Roles(RolNombre.asesor, RolNombre.secretaria, RolNombre.admin)
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
  @Roles(RolNombre.asesor, RolNombre.secretaria, RolNombre.admin)
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
