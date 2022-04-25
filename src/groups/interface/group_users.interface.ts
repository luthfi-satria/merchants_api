import { MerchantUsersStatus } from 'src/database/entities/merchant_users.entity';

export interface GroupUser {
  name: string;

  email: string;

  phone: string;

  password: string;

  group_id: string;

  token_reset_password: string;

  nip: string;

  role_id: string;

  status: MerchantUsersStatus;

  is_multilevel_login: boolean;
}
