import { Module } from '@nestjs/common';
import { TesisService } from './tesis.service';
import { TesisController } from './tesis.controller';
import { AvancesService } from './avances.service';
import { PppModule } from '../ppp/ppp.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { PracticasModule } from '../practicas/practicas.module';

@Module({
  imports: [PppModule, NotificacionesModule, PracticasModule],
  controllers: [TesisController],
  providers: [TesisService, AvancesService],
  exports: [TesisService, AvancesService],
})
export class TesisModule {}