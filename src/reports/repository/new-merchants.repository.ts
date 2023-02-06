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
    const currentPage = Number(data.page) || 1;
    const perPage = Number(data.limit) || 10;
    const offset = (currentPage - 1) * perPage;
    const dateStart = data.date_start || null;
    const dateEnd = data.date_end || null;
    const statuses = data.statuses || [];
    const groupId = data.group_id || null;
    const merchantId = data.merchant_id || null;
    const storeId = data.store_id || null;

    //** QUERIES */
    const queries = this.storeRepository
      .createQueryBuilder('ms')
      .select([
        'ms.id',
        'ms.name',
        'ms.city_id',
        'ms.photo',
        'ms.phone',
        'ms.address',
        'ms.banner',
        'ms.status',
        'ms.created_at',
        'ms.updated_at',
        'ms.approved_at',
        'merchant.id',
        'merchant.group.id',
        'merchant.type',
        'merchant.name',
        'merchant.phone',
        'merchant.address',
        'merchant.lob_id',
        'merchant.pic_name',
        'merchant.pic_nip',
        'merchant.pic_phone',
        'merchant.pic_email',
        'merchant.pic_password',
        'merchant.status',
        'group.id',
        'group.category',
        'group.name',
        'group.phone',
        'group.address',
        'group.status',
        `string_agg(merchant_store_categories_languages.name, ', ') AS merchant_store_categories_name`,
      ])
      .leftJoin('ms.merchant', 'merchant')
      .leftJoin('merchant.group', 'group')
      .leftJoin('ms.store_categories', 'merchant_store_categories')
      .leftJoin(
        'merchant_store_categories.languages',
        'merchant_store_categories_languages',
        'merchant_store_categories_languages.lang = :langs',
        {
          langs: 'id',
        },
      )
      .where('merchant_store_categories_languages.lang = :langs', {
        langs: 'id',
      })
      .groupBy('ms.id')
      .addGroupBy('group.id')
      .addGroupBy('merchant.id')
      .orderBy('ms.name', 'ASC');

    //** SEARCH BY DATE */
    if (dateStart && dateEnd) {
      const start = dateStart + ' 00:00:00 +0700';
      const end = dateEnd + ' 23:59:00 +0700';
      queries.andWhere('ms.created_at BETWEEN :start AND :end', {
        start: start,
        end: end,
      });
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

    const count = await queries.getCount();
    queries.offset(offset).limit(perPage);
    const raw = await queries.getRawMany();

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

  async getCategoriesByStoredId(data: string): Promise<any> {
    const queries = await this.storeRepository
      .createQueryBuilder('ms')
      .leftJoinAndSelect('ms.store_categories', 'merchant_store_categories')
      .leftJoinAndSelect(
        'merchant_store_categories.languages',
        'merchant_store_categories_languages',
        'merchant_store_categories_languages.lang = :lid',
        { lid: 'id' },
      )
      .where('ms.id =:merchant_id', { merchant_id: data })
      .getMany();

    return queries[0].store_categories[0].languages[0].name;
  }
}
