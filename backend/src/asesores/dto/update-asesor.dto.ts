import { PartialType } from '@nestjs/swagger';
import { CreateAsesorDto } from './create-asesor.dto';

export class UpdateAsesorDto extends PartialType(CreateAsesorDto) {}