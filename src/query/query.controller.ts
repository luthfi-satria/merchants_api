import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Header,
  Param,
  Query,
  Res,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { StoresService } from 'src/stores/stores.service';
import { QueryService } from './query.service';
import {
  QueryListStoreDto,
  QueryStoreDetailDto,
} from './validation/query-public.dto';
import { QuerySearchValidation } from './validation/query_search.validation';

@Controller('api/v1/merchants')
export class QueryController {
  constructor(
    private readonly storesService: StoresService,
    private readonly queryService: QueryService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
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
    return await this.queryService.getListQueryStore(data);
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
    return await this.queryService.listStoreCategories(data);
  }

  @Get('query/search')
  @ResponseStatusCode()
  async searchStoreMenu(@Query() query: QuerySearchValidation) {
    console.log(query);

    return this.queryService.searchStoreMenu(query);
  }
}
