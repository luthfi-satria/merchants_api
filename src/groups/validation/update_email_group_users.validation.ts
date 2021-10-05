import { IsEmail } from 'class-validator';

export class UpdateEmailGroupUsersValidation {
  @IsEmail()
  email: string;
}
