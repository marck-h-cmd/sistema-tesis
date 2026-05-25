import { Module } from '@nestjs/common';
import { PracticasService } from './practicas.service';
import { PracticasController } from './practicas.controller';

@Module({
  controllers: [PracticasController],
  providers: [PracticasService],
  exports: [PracticasService],
})
export class PracticasModule {}
