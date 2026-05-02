import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AsesoresService } from './asesores.service';
import { CreateAsesorDto } from './dto/create-asesor.dto';
import { UpdateAsesorDto } from './dto/update-asesor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '../common/enums/enums';

@Controller('asesores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AsesoresController {
  constructor(private readonly asesoresService: AsesoresService) {}

  @Get()
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.estudiante)
  async findAll() {
    const asesores = await this.asesoresService.findAll();
    return { data: asesores };
  }

  @Get(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async findOne(@Param('id') id: string) {
    const asesor = await this.asesoresService.findOne(+id);
    return { data: asesor };
  }

  @Post()
  @Roles(RolNombre.admin)
  async create(@Body() createAsesorDto: CreateAsesorDto) {
    const asesor = await this.asesoresService.create(createAsesorDto);
    return { data: asesor, message: 'Asesor creado exitosamente' };
  }

  @Put(':id')
  @Roles(RolNombre.admin)
  async update(@Param('id') id: string, @Body() updateAsesorDto: UpdateAsesorDto) {
    const asesor = await this.asesoresService.update(+id, updateAsesorDto);
    return { data: asesor, message: 'Asesor actualizado exitosamente' };
  }

  @Get(':id/practicas')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async getPracticas(@Param('id') id: string) {
    const practicas = await this.asesoresService.getPracticasAsignadas(+id);
    return { data: practicas };
  }

  @Get(':id/tesis')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async getTesis(@Param('id') id: string) {
    const tesis = await this.asesoresService.getTesisAsignadas(+id);
    return { data: tesis };
  }
}