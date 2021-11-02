import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  enumStoreStatus,
  StoreDocument,
} from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { IsNull, Not, Repository } from 'typeorm';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { StoresService } from 'src/stores/stores.service';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class InternalService {
  constructor(
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly storeService: StoresService,
    private readonly commonService: CommonService,
  ) {}

  async findStorebyId(id: string): Promise<StoreDocument> {
    return this.storeRepository
      .findOne({
        where: { id: id },
      })
      .then((result) => {
        if (!result) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: id,
                property: 'store_id',
                constraint: ['ID tidak ditemukan.'],
              },
              'Bad Request',
            ),
          );
        }
        return result;
      })
      .catch((err) => {
        console.error('error', err);
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [err.message],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      });
  }

  async findMerchantbyId(id: string): Promise<MerchantDocument> {
    return this.merchantRepository
      .findOne({
        where: { id: id },
      })
      .then((result) => {
        if (!result) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: id,
                property: 'merchant_id',
                constraint: ['ID tidak ditemukan.'],
              },
              'Bad Request',
            ),
          );
        }
        return result;
      })
      .catch((err) => {
        console.error('error', err);
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [err.message],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      });
  }

  async checkIsActiveRole(role_id: string): Promise<number> {
    return this.merchantUsersRepository.count({
      where: [{ role_id: role_id }, { deleted_at: Not(IsNull()) }],
    });
  }

  async updateStoreAveragePrice(
    args: Record<string, any>[],
  ): Promise<RSuccessMessage> {
    for (const raw of args) {
      await this.storeRepository.update(
        { id: raw.store_id },
        { average_price: raw.average_price },
      );
    }
    return {
      success: true,
      message: 'SUCCESS',
    };
  }

  async updatePopulateExistingPricingTemplate(): Promise<RSuccessMessage> {
    const findStores = await this.storeService.findMerchantStores();
    const stores = {
      stores: findStores,
    };

    if (stores) {
      const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/populate_existing_pricing_template`;
      const results: any = await this.commonService.postHttp(url, stores);

      return results;
    }
  }

  async findStoreActivebyMerchantId(
    merchant_id: string,
  ): Promise<StoreDocument[]> {
    const storeData: Partial<StoreDocument> = {
      merchant_id: merchant_id,
      status: enumStoreStatus.active,
    };
    return this.storeService
      .findMerchantStoreByCriteria(storeData)
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: merchant_id,
              property: 'merchant_id',
              constraint: [
                this.messageService.get('merchant.general.dataNotfound'),
              ],
            },
            'Bad Request',
          ),
        );
      });
  }
}
