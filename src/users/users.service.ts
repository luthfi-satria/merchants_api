import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  async getUserAndStore(user_id: string): Promise<MerchantUsersDocument> {
    const userAndStores = await this.merchantUsersRepository.findOne({
      where: { id: user_id },
      relations: ['stores'],
    });
    return userAndStores;
  }
}
