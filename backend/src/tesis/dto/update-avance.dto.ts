import { PartialType } from '@nestjs/swagger';
import { CreateAvanceDto } from './create-avance.dto';

export class UpdateAvanceDto extends PartialType(CreateAvanceDto) {}