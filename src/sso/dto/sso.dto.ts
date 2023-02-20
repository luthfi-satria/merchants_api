import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsString,
  IsUUID,
} from 'class-validator';
import { ssoAddressDocument } from './sso-address.dto';
import { ssoBusinessDocuments } from './sso-bussiness.dto';

export class ssoDto {
  @IsUUID()
  ext_id: string;
  @IsInt()
  sso_id: number;
  @IsEmail()
  email: string;
  @IsString()
  fullname: string;
  @IsString()
  phone_number: string;
  @IsString()
  recovery_phone: string;
  @IsString()
  bio: string;
  @IsString()
  password: string;
  @IsString()
  type: string;
  @IsString()
  gender: string;
  @IsString()
  security_question_id: string;
  @IsString()
  security_question_answer: string;
  @IsBoolean()
  skip_email: boolean;
  @IsBoolean()
  skip_phone: boolean;
  @IsArray()
  business: ssoBusinessDocuments[];
  @IsArray()
  address: ssoAddressDocument[];
}
