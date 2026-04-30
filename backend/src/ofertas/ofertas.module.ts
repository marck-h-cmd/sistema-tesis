import { Module } from '@nestjs/common';
import { OfertasService } from './ofertas.service';
import { OfertasController } from './ofertas.controller';
import { PostulacionesService } from './postulaciones.service';

@Module({
  controllers: [OfertasController],
  providers: [OfertasService, PostulacionesService],
  exports: [OfertasService, PostulacionesService],
})
export class OfertasModule {}