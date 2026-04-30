import { PartialType } from '@nestjs/swagger';
import { CreateTesisDto } from './create-tesis.dto';

export class UpdateTesisDto extends PartialType(CreateTesisDto) {}