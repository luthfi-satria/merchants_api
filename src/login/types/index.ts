import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';

export class MerchantProfileResponse extends MerchantUsersDocument {
  role?: Record<string, any>;

  constructor(init?: Partial<MerchantProfileResponse>) {
    super();
    Object.assign(this, init);
  }
}
