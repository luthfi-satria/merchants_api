import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { StoresService } from 'src/stores/stores.service';
import { QueryService } from './query.service';
import { QueryListStoreDto } from './validation/query-public.dto';

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
  async getstores(
    @Query(new ValidationPipe({ transform: true })) data: QueryListStoreDto,
  ): Promise<any> {
    //return await this.queryService.listGroupStore(data);
    return await this.queryService.getListQueryStore(data);
  }

  @Get('query/stores/categories')
  @ResponseStatusCode()
  async getStoreCategories(@Query() data: string[]): Promise<any> {
    return await this.queryService.listStoreCategories(data);
  }
}
