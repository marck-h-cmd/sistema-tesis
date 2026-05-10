import { Module } from '@nestjs/common';
import { SeguimientoController } from './seguimiento.controller';
import { PracticasModule } from '../practicas/practicas.module';

@Module({
  imports: [PracticasModule],
  controllers: [SeguimientoController],
})
export class SeguimientoModule {}
