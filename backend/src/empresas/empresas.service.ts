import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateConvenioDto } from './dto/create-convenio.dto';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.empresa.findMany({
      include: {
        convenios: true,
        _count: {
          select: {
            ofertas: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      include: {
        convenios: {
          orderBy: { fecha_inicio: 'desc' },
        },
        ofertas: {
          where: { estado: 'abierta' },
          orderBy: { created_at: 'desc' },
        },
        _count: {
          select: {
            ofertas: true,
            convenios: true,
          },
        },
      },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
    }

    return empresa;
  }

  async create(createEmpresaDto: CreateEmpresaDto) {
    const existing = await this.prisma.empresa.findUnique({
      where: { ruc: createEmpresaDto.ruc },
    });

    if (existing) {
      throw new ConflictException('El RUC ya está registrado');
    }

    return this.prisma.empresa.create({
      data: createEmpresaDto,
    });
  }

  async update(id: number, updateEmpresaDto: UpdateEmpresaDto) {
    await this.findOne(id);

    if (updateEmpresaDto.ruc) {
      const existing = await this.prisma.empresa.findFirst({
        where: {
          ruc: updateEmpresaDto.ruc,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('El RUC ya está registrado');
      }
    }

    return this.prisma.empresa.update({
      where: { id },
      data: updateEmpresaDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Verificar si tiene ofertas activas
    const ofertasActivas = await this.prisma.ofertaPractica.count({
      where: {
        empresa_id: id,
        estado: 'abierta',
      },
    });

    if (ofertasActivas > 0) {
      throw new ConflictException('No se puede eliminar: tiene ofertas de práctica activas');
    }

    await this.prisma.empresa.delete({
      where: { id },
    });
  }

  async getConvenios(empresaId: number) {
    await this.findOne(empresaId);

    return this.prisma.convenio.findMany({
      where: { empresa_id: empresaId },
      orderBy: { fecha_inicio: 'desc' },
    });
  }

  async createConvenio(empresaId: number, createConvenioDto: CreateConvenioDto) {
    await this.findOne(empresaId);

    const convenio = await this.prisma.convenio.create({
      data: {
        ...createConvenioDto,
        empresa_id: empresaId,
        fecha_inicio: new Date(createConvenioDto.fecha_inicio),
        fecha_fin: new Date(createConvenioDto.fecha_fin),
      },
    });

    // Actualizar el estado de convenio de la empresa
    if (convenio.estado === 'vigente') {
      await this.prisma.empresa.update({
        where: { id: empresaId },
        data: { convenio_activo: true },
      });
    }

    return convenio;
  }

  async getEstadisticas() {
    const total = await this.prisma.empresa.count();
    const conConvenio = await this.prisma.empresa.count({
      where: { convenio_activo: true },
    });

    const ofertasPorEmpresa = await this.prisma.ofertaPractica.groupBy({
      by: ['empresa_id'],
      _count: { id: true },
      where: { estado: 'abierta' },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return {
      total_empresas: total,
      empresas_con_convenio: conConvenio,
      top_empresas_ofertas: ofertasPorEmpresa,
    };
  }
}