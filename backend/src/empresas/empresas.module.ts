import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller';
import { ConveniosService } from './convenios.service';

@Module({
  controllers: [EmpresasController],
  providers: [EmpresasService, ConveniosService],
  exports: [EmpresasService, ConveniosService],
})
export class EmpresasModule {}