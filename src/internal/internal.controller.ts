import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { StoresService } from 'src/stores/stores.service';
import { InternalService } from './internal.service';

@Controller('api/v1/internal')
export class InternalController {
  constructor(
    private readonly storesService: StoresService,
    private readonly internalService: InternalService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Get('merchants/stores/:id')
  @ResponseStatusCode()
  async getsoresId(
    @Param('id') id: string,
    // @Body()
    // data: Record<string, any>,
  ): Promise<any> {
    console.log('internal request: ', id);
    const rsp = await this.internalService.findStorebyId(id);
    console.log('internal response: ', rsp);
    return rsp;
  }
}
