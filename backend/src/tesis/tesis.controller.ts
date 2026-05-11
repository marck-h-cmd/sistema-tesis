import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { TesisService } from './tesis.service';
import { AvancesService } from './avances.service';
import { CreateTesisDto } from './dto/create-tesis.dto';
import { UpdateTesisDto } from './dto/update-tesis.dto';
import { AdminUpdateTesisDto } from './dto/admin-update-tesis.dto';
import { AsignarJuradoDto } from './dto/asignar-jurado.dto';
import { CreateAvanceDto } from './dto/create-avance.dto';
import { UpdateAvanceDto } from './dto/update-avance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolNombre, EstadoTesis } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RegistrarReciboTurnitinDto,
  RegistrarSimilitudTurnitinDto,
} from './dto/turnitin.dto';
import { SubirDocumentoTesisDto } from './dto/subir-documento-tesis.dto';
import {
  CrearPagoTesisDto,
  CargarComprobantePagoDto,
  VerificarPagoTesisDto,
} from './dto/pago-tesis.dto';
import { ValidarDocumentoTesisDto } from './dto/validar-documento-tesis.dto';
import { RevisionJuradoObservacionesDto } from './dto/revision-jurado.dto';

@Controller('tesis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TesisController {
  constructor(
    private readonly tesisService: TesisService,
    private readonly avancesService: AvancesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.secretaria, RolNombre.estudiante)
  async findAll(
    @Query('estado') estado?: string,
    @Query('escuela_id') escuela_id?: string,
    @Query('asesor_id') asesor_id?: string,
  ) {
    const tesis = await this.tesisService.findAll({
      estado,
      escuela_id: escuela_id ? +escuela_id : undefined,
      asesor_id: asesor_id ? +asesor_id : undefined,
    });
    return { data: tesis };
  }

@Get('estudiante/:estudiante_id')
@Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.secretaria, RolNombre.estudiante)
async findAllByEstudiante(
  @Param('estudiante_id') estudiante_id: string,  // Cambiar @Query a @Param
) {
  const tesis = await this.tesisService.findAllByEstudiante(
    estudiante_id ? +estudiante_id : undefined,
  );
  return { data: tesis };
}

  @Get('estadisticas')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.secretaria)
  async getEstadisticas() {
    const estadisticas = await this.tesisService.getEstadisticas();
    return { data: estadisticas };
  }

  @Get('secretaria/cola-validacion')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.secretaria)
  async colaSecretariaPagosDocumentos() {
    const data = await this.tesisService.colaSecretariaPagosDocumentos();
    return { data };
  }

  @Put(':id/turnitin/recibo')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.secretaria, RolNombre.estudiante)
  async registrarReciboTurnitin(
    @Param('id') id: string,
    @Body() dto: RegistrarReciboTurnitinDto,
    @CurrentUser() user: { id: number },
  ) {
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { usuario_id: user.id },
    });
    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    const tesis = await this.tesisService.registrarReciboTurnitin(
      +id,
      dto.recibo_url,
      estudiante.id,
    );
    return { data: tesis, message: 'Recibo de Turnitin registrado' };
  }

  @Post(':id/documentos')
  @Roles(RolNombre.estudiante, RolNombre.admin, RolNombre.coordinador, RolNombre.secretaria)
  async subirDocumento(
    @Param('id') id: string,
    @Body() dto: SubirDocumentoTesisDto,
    @CurrentUser() user: { id: number },
  ) {
    const doc = await this.tesisService.subirDocumentoTesis(+id, dto, user.id);
    return { data: doc, message: 'Documento registrado' };
  }

  @Put(':id/documentos/:documentoId/validar')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.secretaria)
  async validarDocumentoTesis(
    @Param('id') id: string,
    @Param('documentoId') documentoId: string,
    @Body() dto: ValidarDocumentoTesisDto,
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.tesisService.validarDocumentoTesisAdministrativo(
      +id,
      +documentoId,
      user.id,
      dto,
    );
    return { data: row, message: 'Documento actualizado' };
  }

  @Post(':id/pagos/solicitud')
  @Roles(RolNombre.estudiante)
  async solicitudPagoEstudiante(
    @Param('id') id: string,
    @Body() dto: CrearPagoTesisDto,
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.tesisService.solicitudPagoTesisPorEstudiante(
      +id,
      dto,
      user.id,
    );
    return { data: row, message: 'Solicitud de pago registrada' };
  }

  @Post(':id/pagos')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.secretaria)
  async crearPago(
    @Param('id') id: string,
    @Body() dto: CrearPagoTesisDto,
  ) {
    const row = await this.tesisService.crearPagoTesis(+id, dto);
    return { data: row, message: 'Concepto de pago registrado' };
  }

  @Put(':id/pagos/:pagoId/comprobante')
  @Roles(RolNombre.estudiante)
  async cargarComprobante(
    @Param('id') id: string,
    @Param('pagoId') pagoId: string,
    @Body() dto: CargarComprobantePagoDto,
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.tesisService.cargarComprobantePagoTesis(
      +id,
      +pagoId,
      dto,
      user.id,
    );
    return { data: row, message: 'Comprobante cargado' };
  }

  @Put(':id/pagos/:pagoId/verificar')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.secretaria)
  async verificarPago(
    @Param('id') id: string,
    @Param('pagoId') pagoId: string,
    @Body() dto: VerificarPagoTesisDto,
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.tesisService.verificarPagoTesis(
      +id,
      +pagoId,
      dto,
      user.id,
    );
    return { data: row, message: 'Pago actualizado por administración' };
  }

  @Post(':id/jurados/:juradoTesisId/revision/observaciones')
  @Roles(RolNombre.asesor, RolNombre.admin, RolNombre.coordinador, RolNombre.secretaria)
  async juradoObservaciones(
    @Param('id') id: string,
    @Param('juradoTesisId') juradoTesisId: string,
    @Body() dto: RevisionJuradoObservacionesDto,
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.tesisService.juradoRegistrarObservaciones(
      +id,
      +juradoTesisId,
      user.id,
      dto,
    );
    return { data: row, message: 'Observaciones registradas' };
  }

  @Post(':id/jurados/:juradoTesisId/revision/conforme')
  @Roles(RolNombre.asesor, RolNombre.admin, RolNombre.coordinador, RolNombre.secretaria)
  async juradoConforme(
    @Param('id') id: string,
    @Param('juradoTesisId') juradoTesisId: string,
    @CurrentUser() user: { id: number },
  ) {
    const row = await this.tesisService.juradoMarcarConforme(
      +id,
      +juradoTesisId,
      user.id,
    );
    return { data: row, message: 'Conformidad registrada' };
  }

  @Get(':id/cierre/checklist')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.secretaria)
  async checklistCierre(@Param('id') id: string) {
    const data = await this.tesisService.construirChecklistCierre(+id);
    return { data };
  }

  @Post(':id/cierre/validar-expedito')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async validarExpedito(@Param('id') id: string) {
    const row = await this.tesisService.validarExpedito(+id);
    return { data: row, message: 'Tesis marcada como expedita' };
  }

  @Get(':id/sustentacion/gate')
  @Roles(
    RolNombre.admin,
    RolNombre.coordinador,
    RolNombre.secretaria,
    RolNombre.estudiante,
  )
  async gateSustentacion(@Param('id') id: string) {
    const data = await this.tesisService.gateProgramarSustentacion(+id);
    return { data };
  }

  @Put(':id/sustentacion/programar')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.secretaria)
  async programarSustentacion(
    @Param('id') id: string,
    @Body('fecha') fecha: string,
  ) {
    const row = await this.tesisService.programarSustentacion(+id, fecha);
    return { data: row, message: 'Fecha de sustentación programada' };
  }

  @Put(':id/turnitin/similitud')
  @Roles(RolNombre.asesor, RolNombre.admin, RolNombre.coordinador)
  async registrarSimilitudTurnitin(
    @Param('id') id: string,
    @Body() dto: RegistrarSimilitudTurnitinDto,
    @CurrentUser() user: { id: number; roles: string[] },
  ) {
    const tesis = await this.tesisService.registrarSimilitudTurnitin(
      +id,
      dto.porcentaje,
      user.id,
      user.roles,
    );
    return { data: tesis, message: 'Similitud Turnitin registrada' };
  }

  @Get(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante, RolNombre.secretaria)
  async findOne(@Param('id') id: string) {
    const tesis = await this.tesisService.findOne(+id);
    return { data: tesis };
  }

  @Post()
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.estudiante)
  async create(@Body() createTesisDto: CreateTesisDto) {
    const tesis = await this.tesisService.create(createTesisDto);
    return { data: tesis, message: 'Tesis registrada exitosamente' };
  }

  @Put(':id/admin')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async updateAdmin(
    @Param('id') id: string,
    @Body() dto: AdminUpdateTesisDto,
  ) {
    const tesis = await this.tesisService.updateAdmin(+id, dto);
    return { data: tesis, message: 'Tesis actualizada (administración)' };
  }

  @Put(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async update(
    @Param('id') id: string,
    @Body() updateTesisDto: UpdateTesisDto,
  ) {
    const tesis = await this.tesisService.update(+id, updateTesisDto);
    return { data: tesis, message: 'Tesis actualizada exitosamente' };
  }

  @Put(':id/estado')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async updateEstado(
    @Param('id') id: string,
    @Body('estado') estado: EstadoTesis,
  ) {
    const tesis = await this.tesisService.updateEstado(+id, estado);
    return {
      data: tesis,
      message: `Estado de tesis actualizado a: ${estado}`,
    };
  }

  @Post(':id/jurados')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async asignarJurados(
    @Param('id') id: string,
    @Body() jurados: AsignarJuradoDto[],
  ) {
    const resultado = await this.tesisService.asignarJurado(+id, jurados);
    return { data: resultado, message: 'Jurados asignados exitosamente' };
  }

  @Delete(':id/jurados/:juradoId')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async removerJurado(
    @Param('id') id: string,
    @Param('juradoId') juradoId: string,
  ) {
    await this.tesisService.removerJurado(+id, +juradoId);
    return { message: 'Jurado removido exitosamente' };
  }

  @Post(':id/acta')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async crearActa(
    @Param('id') id: string,
    @Body() actaData: {
      fecha: string;
      lugar?: string;
      nota_final?: number;
      archivo_acta_pdf?: string;
      calificaciones_jurado?: object;
    },
  ) {
    const acta = await this.tesisService.crearActa(+id, actaData);
    return { data: acta, message: 'Acta de sustentación creada exitosamente' };
  }

  // Avances
  @Get(':id/avances')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
  async getAvances(@Param('id') id: string) {
    const avances = await this.tesisService.getAvances(+id);
    return { data: avances };
  }

  @Post(':id/avances')
  @Roles(RolNombre.estudiante)
  async registrarAvance(
    @Param('id') id: string,
    @Body() createAvanceDto: CreateAvanceDto,
  ) {
    const avance = await this.tesisService.registrarAvance(+id, createAvanceDto);
    return { data: avance, message: 'Avance registrado exitosamente' };
  }

  @Put('avances/:avanceId')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async updateAvance(
    @Param('avanceId') avanceId: string,
    @Body() updateAvanceDto: UpdateAvanceDto,
  ) {
    const avance = await this.avancesService.update(+avanceId, updateAvanceDto);
    return { data: avance, message: 'Avance actualizado exitosamente' };
  }

  @Put('avances/:avanceId/revisar')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async revisarAvance(
    @Param('avanceId') avanceId: string,
    @Body('estado') estado: string,
    @Body('observaciones') observaciones?: string,
  ) {
    const avance = await this.avancesService.revisarAvance(
      +avanceId,
      estado,
      observaciones,
    );
    return { data: avance, message: 'Avance revisado exitosamente' };
  }
}