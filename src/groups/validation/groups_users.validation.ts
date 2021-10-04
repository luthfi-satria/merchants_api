import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUUID,
  Length,
} from 'class-validator';
import { MerchantUsersStatus } from 'src/database/entities/merchant_users.entity';

export class MerchantGroupUsersValidation {
  @IsOptional()
  id: string;

  @IsNotEmpty()
  @IsUUID()
  group_id: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  nip: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsIn(Object.values(MerchantUsersStatus))
  status: MerchantUsersStatus;

  @IsNotEmpty()
  @IsUUID()
  role_id: string;
}
