import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { Repository } from 'typeorm';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { DateTimeUtils } from 'src/utils/date-time-utils';

@Injectable()
export class StoreOperationalService {
  private DEFAULT_STORE_OPEN = '08:00';
  private DEFAULT_STORE_CLOSE = '17:00';

  constructor(
    @InjectRepository(StoreOperationalHoursDocument)
    private readonly storeOperationalRepository: Repository<StoreOperationalHoursDocument>,
    @InjectRepository(StoreOperationalShiftDocument)
    private readonly storeShiftsRepository: Repository<StoreOperationalShiftDocument>,
    @InjectRepository(StoreDocument)
    private readonly storesRepository: Repository<StoreDocument>,
  ) {}

  public async createStoreOperationalHours(
    merchantStoreId: string,
    gmt_offset: number,
  ): Promise<StoreOperationalHoursDocument[]> {
    try {
      const operationHours = [...Array(7)].map((e, i) => {
        const utc_openHour = DateTimeUtils.convertTimeToUTC(
          this.DEFAULT_STORE_OPEN,
          gmt_offset,
        );
        const utc_closeHour = DateTimeUtils.convertTimeToUTC(
          this.DEFAULT_STORE_CLOSE,
          gmt_offset,
        );

        return this.storeOperationalRepository.create({
          merchant_store_id: merchantStoreId,
          day_of_week: i,
          gmt_offset: gmt_offset,
          is_open: true,
          shifts: [
            new StoreOperationalShiftDocument({
              close_hour: utc_closeHour,
              open_hour: utc_openHour,
            }),
          ],
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

  public async deleteExistingOperationalShifts(store_operational_id: string) {
    try {
      const result = await this.storeShiftsRepository
        .delete({
          store_operational_id: store_operational_id,
        })
        .catch((e) => {
          throw e;
        });
      return result;
    } catch (e) {
      Logger.error(e.message, '', 'Delete Operational shifts');
      throw e;
    }
  }

  public async forceAllScheduleToOpen(id: string) {
    try {
      return await this.storeOperationalRepository
        .update(id, {
          is_open_24h: true,
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
            'gmt_offset',
            'merchant_store_id',
            'is_open_24h',
            'is_open',
          ],
          relations: ['shifts'],
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
          is_open_24h: false,
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
      const weekDays = Array.from(Array(7)).map((e) => ({ is_open: is_open }));
      const result = await this.storesRepository
        .update(merchant_id, {
          is_store_open: is_open,
        })
        .then(async (res) => {
          await Promise.all(
            weekDays.map(async (day) => {
              await this.storeOperationalRepository.update(
                { merchant_store_id: merchant_id },
                {
                  is_open: day.is_open,
                },
              );
            }),
          );

          return res;
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
    store_id: string,
    data: StoreOperationalHoursDocument[],
  ) {
    try {
      const result = await Promise.all(
        data.map(async (e) => {
          const arrUpdated = await this.storeOperationalRepository
            .save({
              ...e,
              merchant_store_id: store_id,
            })
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

  public async parseOldExistingSchedules(
    oldSchedule: StoreOperationalHoursDocument[],
    newSchedule: StoreOperationalHoursDocument[],
  ) {
    const parsedValue = await Promise.all(
      oldSchedule.map(async (row) => {
        const isFound = newSchedule.find((e) => {
          const isFounded =
            e.day_of_week.toString() === row.day_of_week.toString(); // convert to string because typeorm find() result.
          return isFounded;
        });

        if (isFound) {
          // Delete existing shifts and replace with new ones
          const result = await this.deleteExistingOperationalShifts(
            row.id,
          ).catch((e) => {
            throw e;
          });

          const newSchedules = isFound.shifts.map((e) => {
            return new StoreOperationalShiftDocument({
              ...e,
              store_operational_id: row.id,
            });
          });

          row.shifts = newSchedules;
          row.is_open_24h = isFound.is_open_24h;
          row.gmt_offset = isFound.gmt_offset;
          //row.is_open = isFound.is_open;
        }

        return new StoreOperationalHoursDocument({ ...row });
      }),
    );

    return parsedValue;
  }
}
