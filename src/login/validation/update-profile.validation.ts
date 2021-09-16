import { IsOptional } from 'class-validator';

export class UpdateProfileValidation {
  @IsOptional()
  name: string;

  @IsOptional()
  nip: string;
}
