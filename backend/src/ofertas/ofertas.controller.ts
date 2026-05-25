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
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { OfertasService } from './ofertas.service';
import { PostulacionesService } from './postulaciones.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { UpdateOfertaDto } from './dto/update-oferta.dto';
import { UpdatePostulacionDto } from './dto/update-postulacion.dto';
import { UpdateConvenioEspecificoDto } from './dto/update-convenio-especifico.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolNombre } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('ofertas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OfertasController {
  constructor(
    private readonly ofertasService: OfertasService,
    private readonly postulacionesService: PostulacionesService,
    private readonly prismaService: PrismaService,
  ) { }

  @Get()
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.estudiante, RolNombre.asesor, RolNombre.secretaria, RolNombre.empresa)
  async findAll(
    @Query('empresa_id') empresa_id?: string,
    @Query('estado') estado?: string,
    @Query('modalidad') modalidad?: string,
  ) {
    const ofertas = await this.ofertasService.findAll({
      empresa_id: empresa_id ? +empresa_id : undefined,
      estado,
      modalidad,
    });
    return { data: ofertas };
  }

  @Get('mis-postulaciones')
  @Roles(RolNombre.estudiante, RolNombre.admin, RolNombre.coordinador, RolNombre.secretaria)
  async getMisPostulaciones(@CurrentUser() user: any) {
    const estudiante = await this.prismaService.estudiante.findUnique({
      where: { usuario_id: user.id },
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const postulaciones = await this.postulacionesService.findByEstudiante(
      estudiante.id,
    );
    return { data: postulaciones };
  }

  @Get(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.estudiante, RolNombre.asesor, RolNombre.secretaria, RolNombre.empresa)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const oferta = await this.ofertasService.findOne(id);
    return { data: oferta };
  }

  @Post()
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.empresa)
  async create(@Body() createOfertaDto: CreateOfertaDto) {
    const oferta = await this.ofertasService.create(createOfertaDto);
    return { data: oferta, message: 'Oferta creada exitosamente' };
  }

  @Put(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.empresa)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOfertaDto: UpdateOfertaDto,
  ) {
    const oferta = await this.ofertasService.update(id, updateOfertaDto);
    return { data: oferta, message: 'Oferta actualizada exitosamente' };
  }

  @Delete(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.ofertasService.remove(id);
    return { message: 'Oferta eliminada exitosamente' };
  }

  @Post(':id/cerrar')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async cerrarOferta(@Param('id', ParseIntPipe) id: number) {
    const oferta = await this.ofertasService.cerrarOferta(id);
    return { data: oferta, message: 'Oferta cerrada exitosamente' };
  }

  // Postulaciones
  @Get(':id/postulaciones')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor, RolNombre.estudiante, RolNombre.empresa)
  async getPostulaciones(@Param('id', ParseIntPipe) ofertaId: number) {
    const postulaciones = await this.postulacionesService.findByOferta(ofertaId);
    return { data: postulaciones };
  }

  // En tu controlador de ofertas
  @Post(':id/postulaciones')
  @Roles(RolNombre.estudiante)
  async postular(
    @Param('id', ParseIntPipe) ofertaId: number,
    @Body() body: { cv_url?: string },
    @CurrentUser() user: any,
  ) {
    // Buscar el estudiante por el usuario_id
    const estudiante = await this.prismaService.estudiante.findUnique({
      where: { usuario_id: user.id }
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    // Crear la postulación
    const postulacion = await this.postulacionesService.create({
      oferta_id: ofertaId,
      estudiante_id: estudiante.id,
      cv_url: body.cv_url,
    });

    return { data: postulacion, message: 'Postulación realizada exitosamente' };
  }

  @Put('postulaciones/:postulacionId/estado')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.empresa)
  async updateEstadoPostulacion(
    @Param('postulacionId', ParseIntPipe) postulacionId: number,
    @Body() updatePostulacionDto: UpdatePostulacionDto,
  ) {
    const postulacion = await this.postulacionesService.updateEstado(
      +postulacionId,
      updatePostulacionDto,
    );
    return { data: postulacion, message: 'Estado actualizado exitosamente' };
  }

  @Put('postulaciones/:postulacionId/convenio-especifico')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async updateConvenioEspecifico(
    @Param('postulacionId', ParseIntPipe) postulacionId: number,
    @Body() dto: UpdateConvenioEspecificoDto,
  ) {
    const postulacion = await this.postulacionesService.updateConvenioEspecifico(
      postulacionId,
      dto,
    );
    return { data: postulacion, message: 'Estado de convenio específico actualizado' };
  }

  @Post('postulaciones/:postulacionId/asignar-asesor/:asesorId')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async asignarAsesor(
    @Param('postulacionId') postulacionId: string,
    @Param('asesorId') asesorId: string,
  ) {
    const asignacion = await this.postulacionesService.asignarAsesor(
      +postulacionId,
      +asesorId,
    );
    return { data: asignacion, message: 'Asesor asignado exitosamente' };
  }
}
