import { IsEmail } from 'class-validator';

export class UpdateEmailStoreUsersValidation {
  @IsEmail()
  email: string;
}
