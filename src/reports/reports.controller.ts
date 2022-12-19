import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { ListReprotNewMerchantDTO } from './dto/report.dto';
import { ReportsService } from './reports.service';

@Controller('api/v1/merchants/reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  @Get('new-merchant')
  @UserTypeAndLevel(
    'admin.*',
    'merchant.group',
    'merchant.merchant',
    'merchant.store',
  )
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listNewMerchants(
    @Query() data: ListReprotNewMerchantDTO,
  ): Promise<any> {
    try {
      const listNewMerchantStore = await this.reportsService.listNewMerchants(
        data,
      );
      return this.responseService.success(
        true,
        this.messageService.get('merchant.liststore.success'),
        listNewMerchantStore,
      );
    } catch (error) {
      throw error;
    }
  }

  //** DOWNLOAD MERCHANTS LIST */
  @Get('new-merchant/generate')
  @UserTypeAndLevel(
    'admin.*',
    'merchant.group',
    'merchant.merchant',
    'merchant.store',
  )
  @AuthJwtGuard()
  @ResponseStatusCode()
  async generateExcelNewMerchants(
    @Query() data: ListReprotNewMerchantDTO,
    @Res() res: Response,
  ) {
    try {
      const generateXlsx = await this.reportsService.generateNewMerchantStores(
        data,
        res,
      );

      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        generateXlsx,
      );
    } catch (error) {
      throw error;
    }
  }
}
