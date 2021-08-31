import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { AddonsService } from 'src/addons/addons.service';
import {
  enumDeliveryType,
  enumStoreStatus,
  StoreDocument,
} from 'src/database/entities/store.entity';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MessageService } from 'src/message/message.service';
import {
  ListResponse,
  RMessage,
  RSuccessMessage,
} from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { QueryListStoreDto } from './validation/query-public.dto';

@Injectable()
export class QueryService {
  constructor(
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(StoreCategoriesDocument)
    private readonly storeCategoryRepository: Repository<StoreCategoriesDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly addonService: AddonsService,
    private httpService: HttpService,
    private readonly merchantService: MerchantsService,
    @Hash() private readonly hashService: HashService,
  ) {}

  async listGroupStore(data: QueryListStoreDto): Promise<Record<string, any>> {
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = Number(data.limit) || 10;
    let totalItems: number;
    const store_category_id: string = data.store_category_id || '';
    const delivery_only =
      data.pickup == true
        ? enumDeliveryType.delivery_and_pickup
        : enumDeliveryType.delivery_only;
    const open_24_hour = data.is_24hrs ? true : false;

    const currTime = DateTimeUtils.DateTimeToWIB(new Date());
    const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();

    if (store_category_id == '') {
      return await this.storeRepository
        .createQueryBuilder('merchant_store')
        .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
        .leftJoinAndSelect(
          'merchant_store.operational_hours',
          'operational_hours',
          'operational_hours.merchant_store_id = merchant_store.id',
        )
        .leftJoinAndSelect(
          'merchant_store.store_categories',
          'merchant_store_categories',
        )
        .where(
          new Brackets((qb) => {
            qb.where('operational_hours.day_of_week = :weekOfDay', {
              weekOfDay: weekOfDay,
            });
            qb.andWhere(
              new Brackets((qb) => {
                qb.where('operational_hours.is_open_24h = :is_open_24h', {
                  is_open_24h: true,
                }).orWhere(
                  new Brackets((qb) => {
                    qb.where(':currTime >= operational_hours.open_hour', {
                      currTime: currTime,
                    });
                    qb.andWhere(':currTime < operational_hours.close_hour', {
                      currTime: currTime,
                    });
                  }),
                );
              }),
            );
          }),
        )
        .andWhere('status = :active', { active: enumStoreStatus.active })
        .andWhere('merchant_store.is_open_24h = :open_24_hour', {
          open_24_hour: open_24_hour,
        })
        .andWhere('delivery_type = :delivery_only', {
          delivery_only: delivery_only,
        })
        .andWhere(
          new Brackets((qb) => {
            qb.where('lower(merchant_store.name) like :mname', {
              mname: '%' + search + '%',
            })
              .orWhere('lower(merchant_store.phone) like :sname', {
                sname: '%' + search + '%',
              })
              .orWhere('lower(merchant_store.owner_phone) like :shp', {
                shp: '%' + search + '%',
              })
              .orWhere('lower(merchant_store.owner_email) like :smail', {
                smail: '%' + search + '%',
              })
              .orWhere('lower(merchant_store.address) like :astrore', {
                astrore: '%' + search + '%',
              })
              .orWhere('lower(merchant_store.post_code) like :pcode', {
                pcode: '%' + search + '%',
              })
              .orWhere('lower(merchant_store.guidance) like :guidance', {
                guidance: '%' + search + '%',
                // })
                // .orWhere('lower(merchant_store.location_longitude) like :long', {
                //   long: '%' + search + '%',
                // })
                // .orWhere('lower(merchant_store.location_latitude) like :lat', {
                //   lat: '%' + search + '%',
              });
          }),
        )
        .getCount()
        .then(async (counts) => {
          totalItems = counts;
          return await this.storeRepository
            .createQueryBuilder('merchant_store')
            .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
            .leftJoinAndSelect(
              'merchant_store.operational_hours',
              'operational_hours',
              'operational_hours.merchant_store_id = merchant_store.id',
            )
            .leftJoinAndSelect(
              'merchant_store.store_categories',
              'merchant_store_categories',
            )
            .where(
              new Brackets((qb) => {
                qb.where('operational_hours.day_of_week = :weekOfDay', {
                  weekOfDay: weekOfDay,
                });
                qb.andWhere(
                  new Brackets((qb) => {
                    qb.where('operational_hours.is_open_24h = :is_open_24h', {
                      is_open_24h: true,
                    }).orWhere(
                      new Brackets((qb) => {
                        qb.where(':currTime >= operational_hours.open_hour', {
                          currTime: currTime,
                        });
                        qb.andWhere(
                          ':currTime < operational_hours.close_hour',
                          {
                            currTime: currTime,
                          },
                        );
                      }),
                    );
                  }),
                );
              }),
            )
            .andWhere('status = :active', { active: enumStoreStatus.active })
            .andWhere('merchant_store.is_open_24h = :open_24_hour', {
              open_24_hour: open_24_hour,
            })
            .andWhere('delivery_type = :delivery_only', {
              delivery_only: delivery_only,
            })
            .andWhere(
              new Brackets((qb) => {
                qb.where('lower(merchant_store.name) like :mname', {
                  mname: '%' + search + '%',
                })
                  .orWhere('lower(merchant_store.phone) like :sname', {
                    sname: '%' + search + '%',
                  })
                  .orWhere('lower(merchant_store.owner_phone) like :shp', {
                    shp: '%' + search + '%',
                  })
                  .orWhere('lower(merchant_store.owner_email) like :smail', {
                    smail: '%' + search + '%',
                  })
                  .orWhere('lower(merchant_store.address) like :astrore', {
                    astrore: '%' + search + '%',
                  })
                  .orWhere('lower(merchant_store.post_code) like :pcode', {
                    pcode: '%' + search + '%',
                  })
                  .orWhere('lower(merchant_store.guidance) like :guidance', {
                    guidance: '%' + search + '%',
                    // })
                    // .orWhere(
                    //   'lower(merchant_store.location_longitude) like :long',
                    //   {
                    //     long: '%' + search + '%',
                    //   },
                    // )
                    // .orWhere('lower(merchant_store.location_latitude) like :lat', {
                    //   lat: '%' + search + '%',
                  });
              }),
            )
            .orderBy('merchant_store.created_at', 'DESC')
            .offset((currentPage - 1) * perPage)
            .limit(perPage)
            .getMany();
        })
        .then((result) => {
          result.forEach((row) => {
            dbOutputTime(row);
            delete row.owner_password;
            row.service_addon.forEach((sao) => {
              delete sao.created_at;
              delete sao.updated_at;
            });
          });
          const list_result: ListResponse = {
            total_item: totalItems,
            limit: Number(perPage),
            current_page: Number(currentPage),
            items: result,
          };
          return list_result;
        })
        .catch((err) => {
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
    } else {
      return await this.storeRepository
        .createQueryBuilder('merchant_store')
        .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
        .leftJoinAndSelect(
          'merchant_store.operational_hours',
          'operational_hours',
          'operational_hours.merchant_store_id = merchant_store.id',
        )
        .leftJoinAndSelect(
          'merchant_store.store_categories',
          'merchant_store_categories',
        )
        .where(
          new Brackets((qb) => {
            qb.where('operational_hours.day_of_week = :weekOfDay', {
              weekOfDay: weekOfDay,
            });
            qb.andWhere(
              new Brackets((qb) => {
                qb.where('operational_hours.is_open_24h = :is_open_24h', {
                  is_open_24h: true,
                }).orWhere(
                  new Brackets((qb) => {
                    qb.where(':currTime >= operational_hours.open_hour', {
                      currTime: currTime,
                    });
                    qb.andWhere(':currTime < operational_hours.close_hour', {
                      currTime: currTime,
                    });
                  }),
                );
              }),
            );
          }),
        )
        .andWhere('status = :active', { active: enumStoreStatus.active })
        .andWhere('merchant_store.is_open_24h = :open_24_hour', {
          open_24_hour: open_24_hour,
        })
        .andWhere('delivery_type = :delivery_only', {
          delivery_only: delivery_only,
        })
        .andWhere(
          new Brackets((qb) => {
            qb.where('lower(merchant_store.name) like :mname', {
              mname: '%' + search + '%',
            })
              .orWhere('lower(merchant_store.phone) like :sname', {
                sname: '%' + search + '%',
              })
              .orWhere('lower(merchant_store.owner_phone) like :shp', {
                shp: '%' + search + '%',
              })
              .orWhere('lower(merchant_store.owner_email) like :smail', {
                smail: '%' + search + '%',
              })
              .orWhere('lower(merchant_store.address) like :astrore', {
                astrore: '%' + search + '%',
              })
              .orWhere('lower(merchant_store.post_code) like :pcode', {
                pcode: '%' + search + '%',
              })
              .orWhere('lower(merchant_store.guidance) like :guidance', {
                guidance: '%' + search + '%',
              });
          }),
        )
        .andWhere('merchant_store_categories.id = :stocat', {
          stocat: store_category_id,
        })
        .getCount()
        .then(async (counts) => {
          totalItems = counts;
          return await this.storeRepository
            .createQueryBuilder('merchant_store')
            .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
            .leftJoinAndSelect(
              'merchant_store.operational_hours',
              'operational_hours',
              'operational_hours.merchant_store_id = merchant_store.id',
            )
            .leftJoinAndSelect(
              'merchant_store.store_categories',
              'merchant_store_categories',
            )
            .where(
              new Brackets((qb) => {
                qb.where('operational_hours.day_of_week = :weekOfDay', {
                  weekOfDay: weekOfDay,
                });
                qb.andWhere(
                  new Brackets((qb) => {
                    qb.where('operational_hours.is_open_24h = :is_open_24h', {
                      is_open_24h: true,
                    }).orWhere(
                      new Brackets((qb) => {
                        qb.where(':currTime >= operational_hours.open_hour', {
                          currTime: currTime,
                        });
                        qb.andWhere(
                          ':currTime < operational_hours.close_hour',
                          {
                            currTime: currTime,
                          },
                        );
                      }),
                    );
                  }),
                );
              }),
            )
            .andWhere('status = :active', { active: enumStoreStatus.active })
            .andWhere('merchant_store.is_open_24h = :open_24_hour', {
              open_24_hour: open_24_hour,
            })
            .andWhere('delivery_type = :delivery_only', {
              delivery_only: delivery_only,
            })
            .andWhere(
              new Brackets((qb) => {
                qb.where('lower(merchant_store.name) like :mname', {
                  mname: '%' + search + '%',
                })
                  .orWhere('lower(merchant_store.phone) like :sname', {
                    sname: '%' + search + '%',
                  })
                  .orWhere('lower(merchant_store.owner_phone) like :shp', {
                    shp: '%' + search + '%',
                  })
                  .orWhere('lower(merchant_store.owner_email) like :smail', {
                    smail: '%' + search + '%',
                  })
                  .orWhere('lower(merchant_store.address) like :astrore', {
                    astrore: '%' + search + '%',
                  })
                  .orWhere('lower(merchant_store.post_code) like :pcode', {
                    pcode: '%' + search + '%',
                  })
                  .orWhere('lower(merchant_store.guidance) like :guidance', {
                    guidance: '%' + search + '%',
                  });
              }),
            )
            .andWhere('merchant_store_categories.id = :stocat', {
              stocat: store_category_id,
            })
            .orderBy('merchant_store.created_at', 'DESC')
            .offset((currentPage - 1) * perPage)
            .limit(perPage)
            .getMany();
        })
        .then((result) => {
          result.forEach((row) => {
            dbOutputTime(row);
            delete row.owner_password;
            row.service_addon.forEach((sao) => {
              delete sao.created_at;
              delete sao.updated_at;
            });
          });
          const list_result: ListResponse = {
            total_item: totalItems,
            limit: Number(perPage),
            current_page: Number(currentPage),
            items: result,
          };
          return list_result;
        })
        .catch((err) => {
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
  }

  async listStoreCategories(
    data: Record<string, any>,
  ): Promise<RSuccessMessage> {
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = Number(data.limit) || 10;
    let totalItems: number;

    return await this.storeCategoryRepository
      .createQueryBuilder()
      .where(
        new Brackets((qb) => {
          qb.where('lower(name_id) like :sname', {
            sname: '%' + search + '%',
          }).orWhere('lower(name_en) like :ename', {
            ename: '%' + search + '%',
          });
        }),
      )
      .andWhere('active = true')
      .getCount()
      .then(async (counts) => {
        totalItems = counts;
        return await this.storeCategoryRepository
          .createQueryBuilder()
          .where(
            new Brackets((qb) => {
              qb.where('lower(name_id) like :sname', {
                sname: '%' + search + '%',
              }).orWhere('lower(name_en) like :ename', {
                ename: '%' + search + '%',
              });
            }),
          )
          .andWhere('active = true')
          .orderBy('name_id')
          .offset((currentPage - 1) * perPage)
          .limit(perPage)
          .getMany();
      })
      .then((result) => {
        result.forEach((row) => {
          dbOutputTime(row);
        });
        const listResult: ListResponse = {
          total_item: totalItems,
          limit: Number(perPage),
          current_page: Number(currentPage),
          items: result,
        };
        return this.responseService.success(
          true,
          this.messageService.get('merchant.liststore.success'),
          listResult,
        );
      })
      .catch((err) => {
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

  //------------------------------------------------------------------------------

  async getHttp(
    url: string,
    headers: Record<string, any>,
  ): Promise<Observable<AxiosResponse<any>>> {
    return this.httpService.get(url, { headers: headers }).pipe(
      map((response) => response.data),
      catchError((err) => {
        throw err;
      }),
    );
  }
}
