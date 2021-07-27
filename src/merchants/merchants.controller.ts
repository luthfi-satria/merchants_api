import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { MerchantsService } from './merchants.service';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { RequestValidationPipe } from './validation/request-validation.pipe';
import { RMessage } from 'src/response/response.interface';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MerchantMerchantValidation } from './validation/merchants.validation';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';

@Controller('api/v1/merchants')
export class MerchantsController {
  constructor(
    private readonly merchantsService: MerchantsService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService, // private httpService: HttpService,
  ) {}

  @Post('merchants')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_merchants',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async createmerchants(
    @Body(RequestValidationPipe(MerchantMerchantValidation))
    data: MerchantMerchantValidation,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    if (files.length > 0) {
      files.forEach(function (file) {
        data[file.fieldname] = '/upload_merchants' + file.filename;
      });
    }
    const result: MerchantDocument =
      await this.merchantsService.findMerchantMerchantByPhone(data.merchant_hp);
    if (result) {
      const errors: RMessage = {
        value: data.merchant_hp,
        property: 'merchant_hp',
        constraint: [
          this.messageService.get('merchant.createmerchant.phoneExist'),
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    try {
      const result_db: MerchantDocument =
        await this.merchantsService.createMerchantMerchantProfile(data);
      const rdata: Record<string, any> = {
        name: result_db.merchant_name,
      };
      return this.responseService.success(
        true,
        this.messageService.get('merchant.creategroup.success'),
        rdata,
      );
    } catch (err) {
      const errors: RMessage = {
        value: err.message,
        property: 'createmerchant',
        constraint: [this.messageService.get('merchant.createmerchant.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
  }

  @Put('merchants/:id')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_merchants',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async updatemerchants(
    @Body(RequestValidationPipe(MerchantMerchantValidation))
    data: MerchantMerchantValidation,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    if (files.length > 0) {
      files.forEach(function (file) {
        data[file.fieldname] = '/upload_merchants' + file.filename;
      });
    }
    const logger = new Logger();
    console.log('RequestData: ');
    console.log(data);
    const result: MerchantDocument =
      await this.merchantsService.findMerchantMerchantByPhone(id);
    logger.log(result, 'result: ');
    if (!result) {
      const errors: RMessage = {
        value: data.merchant_hp,
        property: 'merchant_hp',
        constraint: [this.messageService.get('merchant.updatemerchant.unreg')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    data.id_merchant = result.id_merchant;
    try {
      const result_db: MerchantDocument =
        await this.merchantsService.updateMerchantMerchantProfile(data);
      const rdata: Record<string, any> = {
        name: result_db.merchant_name,
      };
      return this.responseService.success(
        true,
        this.messageService.get('merchant.updatemerchant.success'),
        rdata,
      );
    } catch (err) {
      const errors: RMessage = {
        value: err.message,
        property: 'updatemerchant',
        constraint: [this.messageService.get('merchant.updatemerchant.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
  }

  @Delete('merchants/:id')
  async deletemerchants(@Param('id') id: string): Promise<any> {
    try {
      const result: MerchantDocument =
        await this.merchantsService.deleteMerchantMerchantProfile(id);
      const logger = new Logger();
      logger.debug(result.merchant_name, 'result');
      return this.responseService.success(
        true,
        this.messageService.get('merchant.deletemerchant.success'),
      );
    } catch (err) {
      const errors: RMessage = {
        value: err.message,
        property: 'deletemerchant',
        constraint: [this.messageService.get('merchant.deletemerchant.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
  }

  @Get('merchants')
  async getmerchants(@Query() data: string[]): Promise<any> {
    const logger = new Logger();
    const listgroup: any = await this.merchantsService.listGroupMerchant(data);
    logger.debug(listgroup, 'listgroup');
    if (!listgroup) {
      const errors: RMessage = {
        value: '',
        property: 'listgroup',
        constraint: [this.messageService.get('merchant.listmerchant.fail')],
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
      this.messageService.get('merchant.listgroup.success'),
      listgroup,
    );
  }
}
