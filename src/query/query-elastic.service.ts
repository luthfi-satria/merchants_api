import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { SettingsService } from 'src/settings/settings.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { QueryListStoreDto } from './validation/query-public.dto';

@Injectable()
export class QueryElasticService {
  constructor(
    private readonly elasticService: ElasticsearchService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly settingService: SettingsService,
  ) {}

  logger = new Logger(QueryElasticService.name);

  async getStoreList(params: QueryListStoreDto) {
    try {
      const currentPage = params.page ?? 1;
      const perPage = params.limit ?? 10;

      const { terms, sort } = await this.mappingTermsConditions(params);
      const findData = {
        offset: (currentPage - 1) * perPage,
        source: [
          'id',
          'name',
          'status',
          'coordinates',
          'average_price',
          'is_open_24h',
          'store_operational_status',
        ],
        size: perPage,
        query: terms,
        sort: sort,
      };
      console.log(findData, '<= FIND DATA');
      return this.findElasticData(findData);
    } catch (error) {
      console.log(
        '===========================Start Debug error=================================\n',
        new Date(Date.now()).toLocaleString(),
        '\n',
        error,
        '\n============================End Debug error==================================',
      );
      return {};
    }
  }

  async mappingTermsConditions(params) {
    let distance = params.distance || null;
    if (distance == null) {
      const settingRadius = await this.settingService.findByName(
        'store_radius',
      );
      distance = Number(settingRadius.value);
    }

    const terms = {
      must: [],
      filter: {
        geo_distance: {
          distance: `${distance}km`,
          coordinates: {
            lat: params.location_latitude,
            lon: params.location_longitude,
          },
        },
      },
      should: [
        {
          distance_feature: {
            field: 'coordinates', // our geopoint field name
            pivot: `${distance}km`, // radius or max_distance
            origin: {
              lat: params.location_latitude, // client.lat
              lon: params.location_longitude, // client.long
            },
          },
        },
      ],
    };
    const sort = [];

    const currTime = DateTimeUtils.DateTimeToUTC(new Date());
    const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();

    // ===========================================================
    // SEARCH PARAMETERS
    // ===========================================================
    if (typeof params.search != 'undefined' && params.search != '') {
      const findCondition = {
        multi_match: {
          query: params.search,
          type: 'cross_fields',
          fields: ['name', 'merchant.name', 'store_categories.languages.name'],
        },
      };
      terms.must.push(findCondition);
    }

    if (typeof params.is24hrs != 'undefined') {
      const findCondition = {
        match: {
          is_open_24h: params.is24hrs == 'true' ? true : false,
        },
      };
      terms.must.push(findCondition);
    }

    // ===========================================================
    // SORT PARAMETERS
    // ===========================================================

    if (typeof params.sort != 'undefined') {
      const orientation = params.order ? params.order : 'asc';
      if (params.sort == 'distance_in_km') {
        sort.push({
          _geo_distance: {
            coordinates: {
              lat: params.location_latitude,
              lon: params.location_longitude,
            },
            order: orientation,
            unit: 'km',
            mode: 'min',
            distance_type: 'plane',
          },
        });
      }

      if (params.sort == 'price') {
        sort.push({
          average_price: orientation,
        });
      }

      sort.push('_score');
    }

    return { terms, sort };
  }

  async findElasticData(
    findParams: Partial<{
      source: any;
      offset: number;
      size: number;
      query: any;
      sort: any;
    }>,
  ) {
    const searchConfig = {
      index: `${process.env.ELASTICSEARCH_ENV}_efood_stores`,
      from: findParams.offset,
      size: findParams.size,
    //   explain: true,
      body: {
        _source: findParams.source ? findParams.source : [],
        query: {
          bool: findParams.query,
        },
        sort: findParams.sort,
      },
    };
    const { body } = await this.elasticService.search(searchConfig);
    const totalCount = body.hits.total.value;
    const hits = body.hits.hits;
    const data = hits.map((item: any) => item._source);
    return {
      totalCount: totalCount,
      hitsCount: hits,
      result: data,
    };
  }
}
