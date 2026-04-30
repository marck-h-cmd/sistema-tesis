import { Module } from '@nestjs/common';
import { TesisService } from './tesis.service';
import { TesisController } from './tesis.controller';
import { AvancesService } from './avances.service';

@Module({
  controllers: [TesisController],
  providers: [TesisService, AvancesService],
  exports: [TesisService, AvancesService],
})
export class TesisModule {}