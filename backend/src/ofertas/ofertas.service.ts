import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { UpdateOfertaDto } from './dto/update-oferta.dto';

@Injectable()
export class OfertasService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    empresa_id?: number;
    estado?: string;
    modalidad?: string;
  }) {
    const where: any = {};

    if (filters?.empresa_id) where.empresa_id = filters.empresa_id;
    if (filters?.estado) where.estado = filters.estado;
    if (filters?.modalidad) where.modalidad = filters.modalidad;

    return this.prisma.ofertaPractica.findMany({
      where,
      include: {
        empresa: {
          select: {
            id: true,
            razon_social: true,
            ruc: true,
          },
        },
        _count: {
          select: {
            postulaciones: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const oferta = await this.prisma.ofertaPractica.findUnique({
      where: { id },
      include: {
        empresa: true,
        postulaciones: {
          include: {
            estudiante: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombres: true,
                    apellidos: true,
                    email: true,
                  },
                },
                escuela: {
                  select: {
                    nombre: true,
                    facultad: true,
                  },
                },
              },
            },
            asesor_academico: {
              include: {
                usuario: {
                  select: {
                    nombres: true,
                    apellidos: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!oferta) {
      throw new NotFoundException(`Oferta con ID ${id} no encontrada`);
    }

    return oferta;
  }

  async create(createOfertaDto: CreateOfertaDto) {
    return this.prisma.ofertaPractica.create({
      data: {
        ...createOfertaDto,
        fecha_inicio: new Date(createOfertaDto.fecha_inicio),
        fecha_fin: new Date(createOfertaDto.fecha_fin),
      },
    });
  }

  async update(id: number, updateOfertaDto: UpdateOfertaDto) {
    await this.findOne(id);

    const data: any = { ...updateOfertaDto };
    if (updateOfertaDto.fecha_inicio) {
      data.fecha_inicio = new Date(updateOfertaDto.fecha_inicio);
    }
    if (updateOfertaDto.fecha_fin) {
      data.fecha_fin = new Date(updateOfertaDto.fecha_fin);
    }

    return this.prisma.ofertaPractica.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Verificar si tiene postulaciones
    const postulaciones = await this.prisma.postulacion.count({
      where: { oferta_id: id },
    });

    if (postulaciones > 0) {
      // Cerrar la oferta en lugar de eliminarla
      return this.prisma.ofertaPractica.update({
        where: { id },
        data: { estado: 'cerrada' },
      });
    }

    return this.prisma.ofertaPractica.delete({
      where: { id },
    });
  }

  async cerrarOferta(id: number) {
    await this.findOne(id);

    return this.prisma.ofertaPractica.update({
      where: { id },
      data: { estado: 'cerrada' },
    });
  }
}