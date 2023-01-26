import { PartialType } from '@nestjs/mapped-types';
import { CreateElasticDto } from './create-elastic.dto';

export class UpdateElasticDto extends PartialType(CreateElasticDto) {}
