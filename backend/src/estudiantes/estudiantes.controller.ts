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
import { EstudiantesService } from './estudiantes.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '@prisma/client';

@Controller('estudiantes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EstudiantesController {
  constructor(private readonly estudiantesService: EstudiantesService) {}

  @Get()
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
  async findAll() {
    const estudiantes = await this.estudiantesService.findAll();
    return { data: estudiantes };
  }

  @Get(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
  async findOne(@Param('id') id: string) {
    const estudiante = await this.estudiantesService.findOne(+id);
    return { data: estudiante };
  }

  @Get('user/:userId')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante)
  async getByUserId(@Param('userId') userId: string) {
    const estudiante = await this.estudiantesService.getByUserId(+userId);
    return { data: estudiante };
  }

  @Post()
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async create(@Body() createEstudianteDto: CreateEstudianteDto) {
    const estudiante = await this.estudiantesService.create(createEstudianteDto);
    return { data: estudiante, message: 'Estudiante creado exitosamente' };
  }

  @Put(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async update(
    @Param('id') id: string,
    @Body() updateEstudianteDto: UpdateEstudianteDto,
  ) {
    const estudiante = await this.estudiantesService.update(+id, updateEstudianteDto);
    return { data: estudiante, message: 'Estudiante actualizado exitosamente' };
  }

  @Delete(':id')
  @Roles(RolNombre.admin)
  async remove(@Param('id') id: string) {
    await this.estudiantesService.remove(+id);
    return { message: 'Estudiante eliminado exitosamente' };
  }

  @Get(':id/historial-practicas')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.estudiante)
  async getHistorialPracticas(@Param('id') id: string) {
    const historial = await this.estudiantesService.getHistorialPracticas(+id);
    return { data: historial };
  }

  @Get(':id/tesis')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.estudiante, RolNombre.asesor)
  async getTesis(@Param('id') id: string) {
    const tesis = await this.estudiantesService.getTesis(+id);
    return { data: tesis };
  }
}