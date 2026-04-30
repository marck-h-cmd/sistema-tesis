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
} from '@nestjs/common';
import { TesisService } from './tesis.service';
import { AvancesService } from './avances.service';
import { CreateTesisDto } from './dto/create-tesis.dto';
import { UpdateTesisDto } from './dto/update-tesis.dto';
import { AsignarJuradoDto } from './dto/asignar-jurado.dto';
import { CreateAvanceDto } from './dto/create-avance.dto';
import { UpdateAvanceDto } from './dto/update-avance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre, EstadoTesis } from '@prisma/client';

@Controller('tesis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TesisController {
  constructor(
    private readonly tesisService: TesisService,
    private readonly avancesService: AvancesService,
  ) {}

  @Get()
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
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

  @Get('estadisticas')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getEstadisticas() {
    const estadisticas = await this.tesisService.getEstadisticas();
    return { data: estadisticas };
  }

  @Get(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
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
  @Roles(RolNombre.estudiante)
  async updateAvance(
    @Param('avanceId') avanceId: string,
    @Body() updateAvanceDto: UpdateAvanceDto,
  ) {
    const avance = await this.avancesService.update(+avanceId, updateAvanceDto);
    return { data: avance, message: 'Avance actualizado exitosamente' };
  }

  @Put('avances/:avanceId/revisar')
  @Roles(RolNombre.asesor)
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