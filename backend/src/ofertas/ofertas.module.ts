import { Module } from '@nestjs/common';
import { OfertasService } from './ofertas.service';
import { OfertasController } from './ofertas.controller';
import { PostulacionesService } from './postulaciones.service';
import { EmpresasModule } from '../empresas/empresas.module';

@Module({
  imports: [EmpresasModule],
  controllers: [OfertasController],
  providers: [OfertasService, PostulacionesService],
  exports: [OfertasService, PostulacionesService],
})
export class OfertasModule {}