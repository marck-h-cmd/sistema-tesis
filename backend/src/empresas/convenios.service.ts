import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateConvenioDto } from './dto/update-convenio.dto';

@Injectable()
export class ConveniosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.convenio.findMany({
      include: {
        empresa: {
          select: {
            id: true,
            razon_social: true,
            ruc: true,
          },
        },
      },
      orderBy: { fecha_fin: 'asc' },
    });
  }

  async findOne(id: number) {
    const convenio = await this.prisma.convenio.findUnique({
      where: { id },
      include: {
        empresa: true,
      },
    });

    if (!convenio) {
      throw new NotFoundException(`Convenio con ID ${id} no encontrado`);
    }

    return convenio;
  }

  async update(id: number, updateConvenioDto: UpdateConvenioDto) {
    const convenio = await this.findOne(id);

    const data: any = { ...updateConvenioDto };
    if (updateConvenioDto.fecha_inicio) {
      data.fecha_inicio = new Date(updateConvenioDto.fecha_inicio);
    }
    if (updateConvenioDto.fecha_fin) {
      data.fecha_fin = new Date(updateConvenioDto.fecha_fin);
    }

    return this.prisma.convenio.update({
      where: { id },
      data,
    });
  }

  async getVencidos() {
    const hoy = new Date();
    return this.prisma.convenio.findMany({
      where: {
        fecha_fin: { lt: hoy },
        estado: 'vigente',
      },
      include: {
        empresa: true,
      },
    });
  }

  async renovarConvenio(id: number, fechaFin: string) {
    await this.findOne(id);

    return this.prisma.convenio.update({
      where: { id },
      data: {
        fecha_fin: new Date(fechaFin),
        estado: 'vigente',
      },
    });
  }
}