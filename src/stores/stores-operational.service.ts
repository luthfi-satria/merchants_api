import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { Repository } from 'typeorm';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';

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
  ): Promise<StoreOperationalHoursDocument[]> {
    try {
      const operationHours = [...Array(7)].map((e, i) => {
        return this.storeOperationalRepository.create({
          merchant_store_id: merchantStoreId,
          day_of_week: i,
          //day_of_weeks: DateTimeUtils.convertToDayOfWeek(i),
          is_open: true,
          shifts: [
            new StoreOperationalShiftDocument({
              close_hour: this.DEFAULT_STORE_CLOSE,
              open_hour: this.DEFAULT_STORE_OPEN,
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
          //row.is_open = isFound.is_open;
        }

        return new StoreOperationalHoursDocument({ ...row });
      }),
    );

    return parsedValue;
  }
}
