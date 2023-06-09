import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import _ from 'lodash';

@Injectable()
export class CommonStoresService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
  ) {}

  logger = new Logger();

  async getAndValidateStoreByStoreIds(
    storeIds: string[],
    user?: any,
    merchantId?: string,
  ): Promise<StoreDocument[]> {
    if (storeIds.length == 0) {
      return [];
    }
    const query = this.storeRepository
      .createQueryBuilder('merchant_store')
      .leftJoinAndSelect('merchant_store.merchant', 'merchant_store_merchant')
      .leftJoinAndSelect(
        'merchant_store_merchant.group',
        'merchant_store_merchant_group',
      )
      .where('merchant_store.id IN (:...ids)', { ids: storeIds });
    if (merchantId) {
      query.andWhere('merchant_store.merchant_id = :merchant_id', {
        merchant_id: merchantId,
      });
    }

    if (user && user.level == 'store') {
      query.andWhere('merchant_store.id = :store_id', {
        store_id: user.store_id,
      });
    } else if (user && user.level == 'merchant') {
      query.andWhere('merchant_store.merchant_id = :merchant_id', {
        merchant_id: user.merchant_id,
      });
    } else if (user && user.level == 'group') {
      query.andWhere('merchant_store_merchant.group_id = :group_id', {
        group_id: user.group_id,
      });
    }

    const stores = await query.getMany();
    if (!stores) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: 'All store_id',
            property: 'store_id',
            constraint: [
              this.messageService.get('merchant.updatestore.id_notfound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    storeIds.forEach((store_id) => {
      if (!_.find(stores, { id: store_id })) {
        Logger.error(
          ' store_id = ' +
            store_id +
            ' , tidak di temukan atau tidak dimiliki oleh merchant_id atau tidak dimiliki oleh user',
        );
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: store_id,
              property: 'store_id',
              constraint: [
                this.messageService.get(
                  'merchant_user.general.store_not_owned_merchant_nor_user',
                ),
              ],
            },
            'Bad Request',
          ),
        );
      }
    });

    return stores;
  }
}
