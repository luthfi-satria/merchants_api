import { IsNotEmpty } from 'class-validator';

export class UbahPasswordValidation {
  @IsNotEmpty({ message: 'Password lama kosong' })
  old_password: string;

  @IsNotEmpty({ message: 'Password baru kosong' })
  new_password: string;
}
