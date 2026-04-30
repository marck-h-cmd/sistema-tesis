import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAsesorDto } from './dto/create-asesor.dto';
import { UpdateAsesorDto } from './dto/update-asesor.dto';

@Injectable()
export class AsesoresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.asesor.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombres: true,
            apellidos: true,
            dni: true,
            telefono: true,
          },
        },
        escuela: true,
        _count: {
          select: {
            postulaciones: true,
            tesisAsesorPrincipal: true,
            juradoTesis: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const asesor = await this.prisma.asesor.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombres: true,
            apellidos: true,
          },
        },
        escuela: true,
        postulaciones: {
          include: {
            postulacion: {
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
              },
            },
          },
        },
        tesisAsesorPrincipal: {
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
          },
        },
        juradoTesis: {
          include: {
            tesis: {
              select: {
                id: true,
                titulo: true,
              },
            },
          },
        },
      },
    });

    if (!asesor) {
      throw new NotFoundException(`Asesor con ID ${id} no encontrado`);
    }

    return asesor;
  }

  async create(createAsesorDto: CreateAsesorDto) {
    return this.prisma.asesor.create({
      data: createAsesorDto,
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombres: true,
            apellidos: true,
          },
        },
        escuela: true,
      },
    });
  }

  async update(id: number, updateAsesorDto: UpdateAsesorDto) {
    await this.findOne(id);

    return this.prisma.asesor.update({
      where: { id },
      data: updateAsesorDto,
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombres: true,
            apellidos: true,
          },
        },
        escuela: true,
      },
    });
  }

  async getPracticasAsignadas(asesorId: number) {
    return this.prisma.asesorPostulacion.findMany({
      where: { asesor_id: asesorId },
      include: {
        postulacion: {
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
                empresa: true,
              },
            },
            seguimiento: true,
          },
        },
      },
    });
  }

  async getTesisAsignadas(asesorId: number) {
    return this.prisma.tesis.findMany({
      where: {
        OR: [
          { asesor_principal_id: asesorId },
          {
            jurados: {
              some: {
                asesor_id: asesorId,
              },
            },
          },
        ],
      },
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
        avances: {
          orderBy: { fecha_entrega: 'desc' },
        },
        acta: true,
      },
    });
  }
}