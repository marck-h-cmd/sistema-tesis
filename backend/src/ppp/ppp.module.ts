import { Module } from '@nestjs/common';
import { PppGateService } from './ppp-gate.service';

@Module({
  providers: [PppGateService],
  exports: [PppGateService],
})
export class PppModule {}
