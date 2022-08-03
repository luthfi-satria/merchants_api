import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Header,
  InternalServerErrorException,
  Param,
  Query,
  Req,
  Res,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { StoresService } from 'src/stores/stores.service';
import { QueryService } from './query.service';
import {
  QueryListStoreDto,
  QueryStoreDetailDto,
} from './validation/query-public.dto';
import {
  QuerySearchHistoryStoresValidation,
  QuerySearchHistoryValidation,
  QuerySearchValidation,
} from './validation/query_search.validation';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';

@Controller('api/v1/merchants')
export class QueryController {
  constructor(
    private readonly storesService: StoresService,
    private readonly queryService: QueryService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  @Get('image/:id/:id2')
  @Header('Content-type', 'image/jpeg')
  async getimages(
    @Param('id') id: string,
    @Param('id2') id2: string,
    @Res() res,
  ) {
    const folder: string = id;
    const filename: string = id2;
    const path = '' + folder + '/' + filename;

    return res.download(path);
  }

  @Get('query/stores')
  @ResponseStatusCode()
  @UseInterceptors(ClassSerializerInterceptor)
  async getstores(
    @Query(new ValidationPipe({ transform: true })) data: QueryListStoreDto,
  ): Promise<any> {
    return await this.queryService.getStoreList(data);
  }

  @Get('query/stores/detail/:id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ResponseStatusCode()
  async getDetailedStore(
    @Param('id') id: string,
    @Query(new ValidationPipe({ transform: true })) query: QueryStoreDetailDto,
  ) {
    const result = await this.queryService.getDetailedQueryStore(id, query);

    return this.responseService.success(
      true,
      this.messageService.get('merchant.liststore.success'),
      result,
    );
  }

  @Get('query/stores/categories')
  @ResponseStatusCode()
  async getStoreCategories(@Query() data: string[]): Promise<any> {
    return this.queryService.listStoreCategories(data);
  }

  @Get('query/search-as-customer')
  @ResponseStatusCode()
  @UserType('customer')
  @AuthJwtGuard()
  async searchStoreMenuAsCustomer(
    @Req() req: any,
    @Query() query: QuerySearchValidation,
  ) {
    // return this.queryService.searchStoreMenu(query, req.user);
    return this.queryService.optimationSearchStoreMenu(query, req.user);
  }

  @Get('query/search')
  @ResponseStatusCode()
  async searchStoreMenuAsGuest(
    @Req() req: any,
    @Query() query: QuerySearchValidation,
  ) {
    // return this.queryService.searchStoreMenu(query, null);
    return this.queryService.optimationSearchStoreMenu(query, null);
  }

  @Get('query/search/histories/keywords')
  @ResponseStatusCode()
  @UserType('customer')
  @AuthJwtGuard()
  async searchHistoriesKeywords(
    @Req() req: any,
    @Query() query: QuerySearchHistoryValidation,
  ) {
    if (req.user) {
      return this.queryService.searchHistoriesKeywords(query, req.user);
    }
  }

  @Get('query/search/histories/stores')
  @ResponseStatusCode()
  @UserType('customer')
  @AuthJwtGuard()
  async searchHistoriesStores(
    @Req() req: any,
    @Query() query: QuerySearchHistoryStoresValidation,
  ) {
    if (req.user) {
      return this.queryService.searchHistoriesStores(query);
    }
  }

  @Get('query/search/populars')
  @ResponseStatusCode()
  async searchPopulars(
    @Req() req: any,
    @Query() query: QuerySearchHistoryValidation,
  ) {
    return this.queryService.searchPopulars(query);
  }

  @Get('query/price-range')
  @ResponseStatusCode()
  async getPriceRange() {
    return this.queryService.getPriceRange();
  }
}
