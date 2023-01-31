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

    //** QUERIES */
    const queries = this.storeRepository
      .createQueryBuilder('ms')
      .select([
        'ms.*',
        'merchant.id',
        'merchant.group.id',
        'merchant.type',
        'merchant.name',
        'merchant.phone',
        'merchant.logo',
        'merchant.profile_store_photo',
        'merchant.address',
        'merchant.lob_id',
        'merchant.pb1',
        'merchant.pb1_tariff',
        'merchant.npwp_no',
        'merchant.npwp_name',
        'merchant.npwp_file',
        'merchant.is_pos_checkin_enabled',
        'merchant.is_pos_endofday_enabled',
        'merchant.is_pos_printer_enabled',
        'merchant.is_manual_refund_enabled',
        'merchant.is_pos_rounded_payment',
        'merchant.pic_is_multilevel_login',
        'merchant.pic_name',
        'merchant.pic_nip',
        'merchant.pic_phone',
        'merchant.pic_email',
        'merchant.pic_password',
        'merchant.status',
        'merchant.rejection_reason',
        'merchant.approved_at',
        'merchant.created_at',
        'merchant.updated_at',
        'merchant.deleted_at',
        'merchant.rejected_at',
        'merchant.recommended_promo_type',
        'merchant.recommended_discount_type',
        'merchant.recommended_discount_value',
        'merchant.recommended_discount_id',
        'merchant.recommended_shopping_discount_type',
        'merchant.recommended_shopping_discount_value',
        'merchant.recommended_shopping_discount_id',
        'merchant.recommended_delivery_discount_type',
        'merchant.recommended_delivery_discount_value',
        'merchant.recommended_delivery_discount_id',
        'group.id',
        'group.category',
        'group.name',
        'group.phone',
        'group.address',
        'group.siup_no',
        'group.siup_file',
        'group.akta_pendirian_file',
        'group.akta_perubahan_file',
        'group.npwp_no',
        'group.npwp_file',
        'group.director_name',
        'group.director_nip',
        'group.director_phone',
        'group.director_email',
        'group.director_password',
        'group.director_identity_type',
        'group.director_id_no',
        'group.director_id_file',
        'group.director_id_face_file',
        'group.director_is_multilevel_login',
        'group.pic_operational_name',
        'group.pic_operational_nip',
        'group.pic_operational_email',
        'group.pic_operational_phone',
        'group.pic_operational_password',
        'group.pic_operational_is_multilevel_login',
        'group.pic_finance_name',
        'group.pic_finance_nip',
        'group.pic_finance_email',
        'group.pic_finance_phone',
        'group.pic_finance_password',
        'group.pic_finance_is_multilevel_login',
        'group.status',
        'group.approved_at',
        'group.created_at',
        'group.updated_at',
        'group.deleted_at',
        'group.rejected_at',
        'group.cancellation_reason_of_information',
        'group.cancellation_reason_of_document',
        'group.cancellation_reason_of_type_and_service',
        'group.cancellation_reason_of_responsible_person',
        'array_agg(merchant_store_categories_languages.name) AS merchant_store_categories_name',
      ])
      .leftJoin('ms.merchant', 'merchant')
      .leftJoin('merchant.group', 'group')
      .leftJoin('ms.store_categories', 'merchant_store_categories')
      .leftJoin(
        'merchant_store_categories.languages',
        'merchant_store_categories_languages',
      )
      .where('merchant_store_categories_languages.lang =:langs', {
        langs: 'id',
      })
      .groupBy('ms.id')
      .addGroupBy('group.id')
      .addGroupBy('merchant.id')
      .addGroupBy('merchant_store_categories.id')
      .addGroupBy('merchant_store_categories_languages.id')
      .orderBy('ms.name', 'ASC');

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
