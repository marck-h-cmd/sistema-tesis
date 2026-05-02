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
import { OfertasService } from './ofertas.service';
import { PostulacionesService } from './postulaciones.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { UpdateOfertaDto } from './dto/update-oferta.dto';
import { CreatePostulacionDto } from './dto/create-postulacion.dto';
import { UpdatePostulacionDto } from './dto/update-postulacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolNombre } from '@prisma/client';

@Controller('ofertas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OfertasController {
  constructor(
    private readonly ofertasService: OfertasService,
    private readonly postulacionesService: PostulacionesService,
  ) {}

  @Get()
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.estudiante, RolNombre.asesor)
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

  @Get(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.estudiante, RolNombre.asesor)
  async findOne(@Param('id') id: string) {
    const oferta = await this.ofertasService.findOne(+id);
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
    @Param('id') id: string,
    @Body() updateOfertaDto: UpdateOfertaDto,
  ) {
    const oferta = await this.ofertasService.update(+id, updateOfertaDto);
    return { data: oferta, message: 'Oferta actualizada exitosamente' };
  }

  @Delete(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async remove(@Param('id') id: string) {
    await this.ofertasService.remove(+id);
    return { message: 'Oferta eliminada exitosamente' };
  }

  @Post(':id/cerrar')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async cerrarOferta(@Param('id') id: string) {
    const oferta = await this.ofertasService.cerrarOferta(+id);
    return { data: oferta, message: 'Oferta cerrada exitosamente' };
  }

  // Postulaciones
  @Get(':id/postulaciones')
  @Roles(RolNombre.admin, RolNombre.coordinador, RolNombre.asesor)
  async getPostulaciones(@Param('id') id: string) {
    const postulaciones = await this.postulacionesService.findAll();
    return { data: postulaciones };
  }

  @Post(':id/postulaciones')
  @Roles(RolNombre.estudiante)
  async postular(
    @Param('id') ofertaId: number,
    @Body() createPostulacionDto: CreatePostulacionDto,
    @CurrentUser() user: any,
  ) {
    createPostulacionDto.oferta_id = +ofertaId;
    const postulacion = await this.postulacionesService.create(createPostulacionDto);
    return { data: postulacion, message: 'Postulación realizada exitosamente' };
  }

  @Put('postulaciones/:postulacionId/estado')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async updateEstadoPostulacion(
    @Param('postulacionId') postulacionId: string,
    @Body() updatePostulacionDto: UpdatePostulacionDto,
  ) {
    const postulacion = await this.postulacionesService.updateEstado(
      +postulacionId,
      updatePostulacionDto,
    );
    return { data: postulacion, message: 'Estado actualizado exitosamente' };
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