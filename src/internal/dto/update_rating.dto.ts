import { IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRatingDTO {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  rating: number;
}
