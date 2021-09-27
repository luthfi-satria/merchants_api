import { MerchantUsersStatus } from 'src/database/entities/merchant_users.entity';

export interface MerchantUser {
  name: string;

  email: string;

  phone: string;

  password: string;

  merchant_id: string;

  token_reset_password: string;

  nip: string;

  status: MerchantUsersStatus;
}
