import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { BanksService } from './banks.service';

@Controller('api/v1/merchants')
export class BanksController {
  constructor(
    private readonly banksService: BanksService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  @Get('banks')
  @ResponseStatusCode()
  async getgroups(@Query() data: string[]): Promise<any> {
    const listgroup: any = await this.banksService.listBanks(data);
    if (!listgroup) {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get('merchant.listbank.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    return this.responseService.success(
      true,
      this.messageService.get('merchant.listbank.success'),
      listgroup,
    );
  }
}
