import { IsString } from 'class-validator';

export class SsoAuthDocument {
  @IsString()
  name: string;
  @IsString()
  secret_key: string;
  @IsString()
  device_id: string;
  @IsString()
  device_type: string;
}
