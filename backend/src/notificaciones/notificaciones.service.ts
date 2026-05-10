import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class NotificacionesService {
  constructor(private prisma: PrismaService) {}

  async crearParaUsuario(
    usuarioId: number,
    titulo: string,
    mensaje: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.notificacion.create({
      data: {
        usuario_id: usuarioId,
        titulo,
        mensaje,
        metadata: metadata as object | undefined,
      },
    });
  }

  async listarPorUsuario(usuarioId: number, soloNoLeidas?: boolean) {
    return this.prisma.notificacion.findMany({
      where: {
        usuario_id: usuarioId,
        ...(soloNoLeidas ? { leida: false } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }

  async marcarLeida(id: number, usuarioId: number) {
    return this.prisma.notificacion.updateMany({
      where: { id, usuario_id: usuarioId },
      data: { leida: true },
    });
  }
}
