import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostulacionDto } from './dto/create-postulacion.dto';
import { UpdatePostulacionDto } from './dto/update-postulacion.dto';

@Injectable()
export class PostulacionesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.postulacion.findMany({
      include: {
        estudiante: {
          include: {
            usuario: {
              select: {
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
        oferta: {
          include: {
            empresa: {
              select: {
                razon_social: true,
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
        seguimiento: true,
      },
      orderBy: { fecha_postulacion: 'desc' },
    });
  }

  async findOne(id: number) {
    const postulacion = await this.prisma.postulacion.findUnique({
      where: { id },
      include: {
        estudiante: {
          include: {
            usuario: true,
            escuela: true,
          },
        },
        oferta: {
          include: {
            empresa: true,
          },
        },
        asesor_academico: {
          include: {
            usuario: true,
          },
        },
        seguimiento: true,
      },
    });

    if (!postulacion) {
      throw new NotFoundException(`Postulación con ID ${id} no encontrada`);
    }

    return postulacion;
  }

  async create(createPostulacionDto: CreatePostulacionDto) {
    // Verificar que el estudiante no se haya postulado ya
    const existing = await this.prisma.postulacion.findFirst({
      where: {
        estudiante_id: createPostulacionDto.estudiante_id,
        oferta_id: createPostulacionDto.oferta_id,
      },
    });

    if (existing) {
      throw new ConflictException('El estudiante ya se postuló a esta oferta');
    }

    // Verificar que la oferta esté abierta
    const oferta = await this.prisma.ofertaPractica.findUnique({
      where: { id: createPostulacionDto.oferta_id },
    });

    if (!oferta || oferta.estado !== 'abierta') {
      throw new ConflictException('La oferta no está disponible');
    }

    // Verificar vacantes
    const postulantes = await this.prisma.postulacion.count({
      where: {
        oferta_id: createPostulacionDto.oferta_id,
        estado: 'aceptado',
      },
    });

    if (postulantes >= oferta.vacantes) {
      throw new ConflictException('No hay vacantes disponibles');
    }

    return this.prisma.postulacion.create({
      data: createPostulacionDto,
    });
  }

  async updateEstado(id: number, updatePostulacionDto: UpdatePostulacionDto) {
    const postulacion = await this.findOne(id);

    const data: any = { ...updatePostulacionDto };

    // Si se acepta la postulación, crear seguimiento
    if (updatePostulacionDto.estado === 'aceptado') {
      await this.prisma.seguimientoPractica.create({
        data: {
          postulacion_id: id,
          horas_cumplidas: 0,
          horas_totales: 300,
          evaluacion: 'pendiente',
        },
      });
    }

    return this.prisma.postulacion.update({
      where: { id },
      data,
    });
  }

  async asignarAsesor(postulacionId: number, asesorId: number) {
    const postulacion = await this.findOne(postulacionId);

    // Verificar si ya tiene asesor asignado
    const existing = await this.prisma.asesorPostulacion.findUnique({
      where: { postulacion_id: postulacionId },
    });

    if (existing) {
      // Actualizar
      return this.prisma.asesorPostulacion.update({
        where: { postulacion_id: postulacionId },
        data: { asesor_id: asesorId },
      });
    }

    // Crear asignación
    return this.prisma.asesorPostulacion.create({
      data: {
        asesor_id: asesorId,
        postulacion_id: postulacionId,
      },
    });
  }
}