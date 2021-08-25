import { Controller, Get, Param } from '@nestjs/common';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { InternalService } from './internal.service';

@Controller('api/v1/internal')
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  @Get('merchants/stores/:id')
  @ResponseStatusCode()
  async getsoresId(@Param('id') id: string): Promise<any> {
    console.log('internal request: ', id);
    const rsp = await this.internalService.findStorebyId(id);
    console.log('internal response: ', rsp);
    return rsp;
  }
}
