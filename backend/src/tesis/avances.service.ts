import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAvanceDto } from './dto/update-avance.dto';

@Injectable()
export class AvancesService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
    const avance = await this.prisma.avanceTesis.findUnique({
      where: { id },
      include: {
        tesis: {
          select: {
            id: true,
            titulo: true,
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
      },
    });

    if (!avance) {
      throw new NotFoundException(`Avance con ID ${id} no encontrado`);
    }

    return avance;
  }

  async update(id: number, updateAvanceDto: UpdateAvanceDto) {
    await this.findOne(id);

    return this.prisma.avanceTesis.update({
      where: { id },
      data: updateAvanceDto,
    });
  }

  async revisarAvance(id: number, estado: string, observaciones?: string) {
    await this.findOne(id);

    return this.prisma.avanceTesis.update({
      where: { id },
      data: {
        estado,
        observaciones,
      },
    });
  }

  async delete(id: number) {
    await this.findOne(id);

    return this.prisma.avanceTesis.delete({
      where: { id },
    });
  }
}