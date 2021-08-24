import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { Repository } from 'typeorm';
import { IStoreOperationalPayload } from './types';

@Injectable()
export class StoreOperationalService {
  private DEFAULT_STORE_OPEN = '08:00';
  private DEFAULT_STORE_CLOSE = '17:00';

  constructor(
    @InjectRepository(StoreOperationalHoursDocument)
    private readonly storeOperationalRepository: Repository<StoreOperationalHoursDocument>,
    @InjectRepository(StoreDocument)
    private readonly storesRepository: Repository<StoreDocument>,
  ) {}

  public async createStoreOperationalHours(
    merchantStoreId: string,
  ): Promise<StoreOperationalHoursDocument[]> {
    try {
      const operationHours = [...Array(7)].map((e, i) => {
        return this.storeOperationalRepository.create({
          merchant_store_id: merchantStoreId,
          day_of_week: i,
          open_hour: this.DEFAULT_STORE_OPEN,
          close_hour: this.DEFAULT_STORE_CLOSE,
          is_open: true,
        });
      });

      const result: StoreOperationalHoursDocument[] =
        await this.storeOperationalRepository
          .save(operationHours)
          .catch((e) => {
            throw e;
          });

      return result.map((e) => {
        // format result
        delete e.store;
        delete e.created_at;
        delete e.updated_at;

        return e;
      });
    } catch (e) {
      throw e;
    }
  }

  public async forceAllScheduleToOpen(id: string) {
    try {
      return await this.storeOperationalRepository
        .update(id, {
          open_hour: '00:00',
          close_hour: '23:59',
        })
        .catch((e) => {
          throw e;
        });
    } catch (e) {
      Logger.error(e.message, '', 'Update schedule 24 hours');
      throw e;
    }
  }

  public async getAllStoreScheduleByStoreId(
    store_id: string,
  ): Promise<StoreOperationalHoursDocument[]> {
    try {
      return await this.storeOperationalRepository
        .find({
          where: { merchant_store_id: store_id },
          select: [
            'id',
            'day_of_week',
            'open_hour',
            'close_hour',
            'merchant_store_id',
          ],
          order: { day_of_week: 'ASC' },
        })
        .catch((e) => {
          throw e;
        });
    } catch (e) {
      Logger.error(e.message, '', 'Query Get Operational Hours');
      throw e;
    }
  }

  public async resetScheduleToDefault(id: string) {
    try {
      return await this.storeOperationalRepository
        .update(id, {
          open_hour: '08:00',
          close_hour: '17:00',
        })
        .catch((e) => {
          throw e;
        });
    } catch (e) {
      Logger.error(e.message, '', 'Update Reset schedule 24 hour');
      throw e;
    }
  }

  public async updateStoreOpenStatus(merchant_id: string, is_open: boolean) {
    try {
      const result = await this.storesRepository
        .update(merchant_id, {
          is_store_open: is_open,
        })
        .catch((e) => {
          throw e;
        });

      return result;
    } catch (e) {
      throw e;
    }
  }

  public async updateStoreOperationalHours(
    merchant_id: string,
    data: IStoreOperationalPayload[],
  ) {
    try {
      const result = await Promise.all(
        data.map(async (e) => {
          const arrUpdated = await this.storeOperationalRepository
            .update(
              {
                merchant_store_id: merchant_id,
                day_of_week: e.day_of_week,
              },
              {
                open_hour: e.open_hour,
                close_hour: e.close_hour,
              },
            )
            .catch((e) => {
              throw e;
            });

          return arrUpdated;
        }),
      ).catch((e) => {
        throw e;
      });

      return result;
    } catch (e) {
      Logger.error(e.message, '', 'Update Store Operational');
      throw e;
    }
  }
}
