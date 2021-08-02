import { IsEmail, IsNotEmpty } from 'class-validator';

export class GroupLoginEmailValidation {
  @IsNotEmpty()
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  access_type: string;
}
