import { IsNotEmpty, IsUUID } from 'class-validator';
export class CreateUserDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
  @IsNotEmpty()
  password: string;
}
