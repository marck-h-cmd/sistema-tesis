import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { ConveniosService } from './convenios.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateConvenioDto } from './dto/create-convenio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '@prisma/client';

@Controller('empresas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpresasController {
  constructor(
    private readonly empresasService: EmpresasService,
    private readonly conveniosService: ConveniosService,
  ) {}

  @Get()
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.estudiante, RolNombre.asesor)
  async findAll() {
    const empresas = await this.empresasService.findAll();
    return { data: empresas };
  }

  @Get('estadisticas')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getEstadisticas() {
    const estadisticas = await this.empresasService.getEstadisticas();
    return { data: estadisticas };
  }

  @Get(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.estudiante, RolNombre.asesor)
  async findOne(@Param('id') id: string) {
    const empresa = await this.empresasService.findOne(+id);
    return { data: empresa };
  }

  @Post()
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async create(@Body() createEmpresaDto: CreateEmpresaDto) {
    const empresa = await this.empresasService.create(createEmpresaDto);
    return { data: empresa, message: 'Empresa creada exitosamente' };
  }

  @Put(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async update(@Param('id') id: string, @Body() updateEmpresaDto: UpdateEmpresaDto) {
    const empresa = await this.empresasService.update(+id, updateEmpresaDto);
    return { data: empresa, message: 'Empresa actualizada exitosamente' };
  }

  @Delete(':id')
  @Roles(RolNombre.admin)
  async remove(@Param('id') id: string) {
    await this.empresasService.remove(+id);
    return { message: 'Empresa eliminada exitosamente' };
  }

  @Get(':id/convenios')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async getConvenios(@Param('id') id: string) {
    const convenios = await this.empresasService.getConvenios(+id);
    return { data: convenios };
  }

  @Post(':id/convenios')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async createConvenio(
    @Param('id') id: string,
    @Body() createConvenioDto: CreateConvenioDto,
  ) {
    const convenio = await this.empresasService.createConvenio(+id, createConvenioDto);
    return { data: convenio, message: 'Convenio creado exitosamente' };
  }
}