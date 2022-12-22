import { BadRequestException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Brackets, EntityRepository, Repository } from 'typeorm';
import { ListReprotNewMerchantDTO } from '../dto/report.dto';

@EntityRepository(StoreDocument)
export class NewMerchantEntity extends Repository<StoreDocument> {
  constructor(
    @InjectRepository(StoreDocument)
    public readonly storeRepository: Repository<StoreDocument>,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {
    super();
  }

  async listNewMerchantsData(data: ListReprotNewMerchantDTO): Promise<any> {
    const search = data.search || '';
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;
    const indexPage = (Number(currentPage) - 1) * perPage;
    const dateStart = data.date_start || null;
    const dateEnd = data.date_end || null;
    const statuses = data.statuses || [];
    const groupId = data.group_id || null;
    const merchantId = data.merchant_id || null;
    const storeId = data.store_id || null;
    const lang = '';

    //** QUERIES */
    const queries = this.storeRepository
      .createQueryBuilder('ms')
      .leftJoinAndSelect('ms.merchant', 'merchant')
      .leftJoinAndSelect('merchant.group', 'group')
      .leftJoinAndSelect('ms.store_categories', 'merchant_store_categories')
      .leftJoinAndSelect(
        'merchant_store_categories.languages',
        'merchant_store_categories_languages',
        'merchant_store_categories_languages.lang = :lid',
        { lid: lang ? lang : 'id' },
      )
      .orderBy('ms.created_at', 'ASC');

    //** SEARCH BY DATE */
    if (dateStart && dateEnd) {
      const start = dateStart + ' 00:00:00';
      const end = dateEnd + ' 23:59:00';
      queries.andWhere(
        new Brackets((qb) => {
          qb.where(
            new Brackets((iqb) => {
              iqb
                .where('ms.created_at >= :start', {
                  start,
                })
                .andWhere('ms.created_at <= :end', {
                  end,
                });
            }),
          );
        }),
      );
    }

    //** SERACH BY NAME or CORPORATE & BRAND & STORE */
    if (search) {
      queries.andWhere(
        new Brackets((qb) => {
          qb.where('ms.name ilike :mname', {
            mname: '%' + search.toLowerCase() + '%',
          });
          qb.orWhere('ms.phone ilike :sname', {
            sname: '%' + search.toLowerCase() + '%',
          });
          qb.orWhere('merchant.name ilike :bname', {
            bname: '%' + search.toLowerCase() + '%',
          });
          qb.orWhere('group.name ilike :gname', {
            gname: '%' + search.toLowerCase() + '%',
          });
        }),
      );
    }

    if (groupId) {
      queries.andWhere('group.id = :groupId', {
        groupId,
      });
    }

    if (merchantId) {
      queries.andWhere('merchant.id = :merchantId', {
        merchantId,
      });
    }

    if (storeId) {
      queries.andWhere('ms.id = :storeId', {
        storeId,
      });
    }

    //** STATUS STORES */
    if (data.status) {
      statuses.push(data.status);
    }
    if (statuses.length > 0) {
      queries.andWhere('ms.status in (:...gstat)', {
        gstat: statuses,
      });
    }

    const rawAll = await queries.getRawMany();
    const raw = rawAll.slice(indexPage, indexPage + Number(perPage));
    const count = rawAll.length;

    raw.forEach((item) => {
      for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          const element = item[key];
          if (key.startsWith('di_')) {
            item[key.slice(3)] = element;
            delete item[key];
          }
        }
      }
    });

    //** EXECUTE QUERIES */
    try {
      return {
        total_item: count,
        limit: Number(perPage),
        current_page: Number(currentPage),
        items: raw,
      };
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }
}
