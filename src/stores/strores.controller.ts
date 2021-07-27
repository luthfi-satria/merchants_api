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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { RequestValidationPipe } from './validation/request-validation.pipe';
import { RMessage } from 'src/response/response.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MerchantStoreValidation } from './validation/stores.validation';
import { StoreDocument } from 'src/database/entities/store.entity';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';
import { StoresService } from './stores.service';

@Controller('api/v1/merchants')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService, // private httpService: HttpService,
  ) {}

  @Post('stores')
  @UseInterceptors(
    FileInterceptor('upload_photo_store', {
      storage: diskStorage({
        destination: './upload_stores',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async createstores(
    @Body(RequestValidationPipe(MerchantStoreValidation))
    data: MerchantStoreValidation,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const logger = new Logger();
    const result: StoreDocument =
      await this.storesService.findMerchantStoreByPhone(data.store_hp);

    if (result) {
      const errors: RMessage = {
        value: data.store_hp,
        property: 'store_hp',
        constraint: [
          this.messageService.get('merchant.createstore.phoneExist'),
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
      logger.debug(file, 'file');
      if (file) data.upload_photo_store = '/upload_stores/' + file.filename;
      const result_db: StoreDocument =
        await this.storesService.createMerchantStoreProfile(data);
      const rdata: Record<string, any> = {
        name: result_db.group_name,
      };
      return this.responseService.success(
        true,
        this.messageService.get('merchant.createstore.success'),
        rdata,
      );
    } catch (err) {
      const errors: RMessage = {
        value: err.message,
        property: 'createstore',
        constraint: [this.messageService.get('merchant.createstore.fail')],
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

  @Put('stores/:id')
  @UseInterceptors(
    FileInterceptor('upload_photo_store', {
      storage: diskStorage({
        destination: './upload_stores',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async updatestores(
    @Body(RequestValidationPipe(MerchantStoreValidation))
    data: MerchantStoreValidation,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const result: StoreDocument = await this.storesService.findMerchantById(id);

    if (!result) {
      const errors: RMessage = {
        value: data.store_hp,
        property: 'store_hp',
        constraint: [this.messageService.get('merchant.updatestore.unreg')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    data.id_store = result.id_store;
    try {
      if (file) data.upload_photo_store = '/upload_stores/' + file.filename;
      const result_db: StoreDocument =
        await this.storesService.updateMerchantStoreProfile(data);
      const rdata: Record<string, any> = {
        name: result_db.store_name,
      };
      return this.responseService.success(
        true,
        this.messageService.get('merchant.updatestore.success'),
        rdata,
      );
    } catch (err) {
      const errors: RMessage = {
        value: err.message,
        property: 'updatestore',
        constraint: [this.messageService.get('merchant.updatestore.fail')],
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

  @Delete('stores/:id')
  async deletestores(@Param('id') id: string): Promise<any> {
    try {
      const result: StoreDocument =
        await this.storesService.deleteMerchantStoreProfile(id);
      const logger = new Logger();
      logger.debug(result.group_name, 'result');
      return this.responseService.success(
        true,
        this.messageService.get('merchant.deletestore.success'),
      );
    } catch (err) {
      const errors: RMessage = {
        value: err.message,
        property: 'deletestore',
        constraint: [this.messageService.get('merchant.deletestore.fail')],
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

  @Get('stores')
  async getsores(@Query() data: string[]): Promise<any> {
    const logger = new Logger();
    const listgroup: any = await this.storesService.listGroupStore(data);
    logger.debug(listgroup, 'listgroup');
    if (!listgroup) {
      const errors: RMessage = {
        value: '',
        property: 'listgroup',
        constraint: [this.messageService.get('merchant.listgroup.fail')],
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
