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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { MerchantService } from './merchant.service';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { RequestValidationPipe } from './validation/request-validation.pipe';
import { MerchantGroupValidation } from './validation/merchant.group.validation';
import { GroupDocument } from 'src/database/entities/group.entity';
import { RMessage } from 'src/response/response.interface';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MerchantMerchantValidation } from './validation/merchant.merchant.validation';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantStoreValidation } from './validation/merchant.store.validation';
import { StoreDocument } from 'src/database/entities/store.entity';
// import { editFileName, imageFileFilter } from 'src/utils/general-utils';

export const editFileName = (req: any, file: any, callback: any) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

const imageFileFilter = (req: any, file: any, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

@Controller('api/v1/merchants')
export class MerchantController {
  constructor(
    private readonly merchantService: MerchantService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService, // private httpService: HttpService,
  ) {}

  @Post('groups')
  @UseInterceptors(
    FileInterceptor('upload_photo_ktp', {
      storage: diskStorage({
        destination: './upload',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async creategroups(
    @Body(RequestValidationPipe(MerchantGroupValidation))
    data: MerchantGroupValidation,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const logger = new Logger();
    logger.debug(file, 'File');
    const result: GroupDocument =
      await this.merchantService.findMerchantByPhone(data.group_hp);

    if (result) {
      const errors: RMessage = {
        value: data.group_hp,
        property: 'group_hp',
        constraint: [
          this.messageService.get('merchant.creategroup.phoneExist'),
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
      if (file) data.upload_photo_ktp = '/upload/' + file.filename;
      const result_db: GroupDocument =
        await this.merchantService.createMerchantGroupProfile(data);
      const rdata: Record<string, any> = {
        name: result_db.group_name,
      };
      return this.responseService.success(
        true,
        this.messageService.get('merchant.creategroup.success'),
        rdata,
      );
    } catch (err) {
      const errors: RMessage = {
        value: err.message,
        property: 'creategroup',
        constraint: [this.messageService.get('merchant.creategroup.fail')],
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

  @Put('groups')
  @UseInterceptors(
    FileInterceptor('upload_photo_ktp', {
      storage: diskStorage({
        destination: './upload',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async updategroups(
    @Body(RequestValidationPipe(MerchantGroupValidation))
    data: MerchantGroupValidation,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const result: GroupDocument =
      await this.merchantService.findMerchantByPhone(data.group_hp);

    if (!result) {
      const errors: RMessage = {
        value: data.group_hp,
        property: 'group_hp',
        constraint: [this.messageService.get('merchant.updategroup.unreg')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    data.id_group = result.id_group;
    try {
      if (file) data.upload_photo_ktp = '/upload/' + file.filename;
      const result_db: GroupDocument =
        await this.merchantService.updateMerchantGroupProfile(data);
      const rdata: Record<string, any> = {
        name: result_db.group_name,
      };
      return this.responseService.success(
        true,
        this.messageService.get('merchant.updategroup.success'),
        rdata,
      );
    } catch (err) {
      const errors: RMessage = {
        value: err.message,
        property: 'updategroup',
        constraint: [this.messageService.get('merchant.updategroup.fail')],
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

  @Delete('groups/:id')
  async deletegroups(@Param('id') id: string): Promise<any> {
    try {
      const result: GroupDocument =
        await this.merchantService.deleteMerchantGroupProfile(id);
      const logger = new Logger();
      logger.debug(result.group_name, 'result');
      return this.responseService.success(
        true,
        this.messageService.get('merchant.deletegroup.success'),
      );
    } catch (err) {
      const errors: RMessage = {
        value: err.message,
        property: 'deletegroup',
        constraint: [this.messageService.get('merchant.deletegroup.fail')],
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

  @Get('groups')
  async getgroups(@Query() data: string[]): Promise<any> {
    const logger = new Logger();
    const listgroup: any = await this.merchantService.listGroup(data);
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
    const logger = new Logger();
    logger.debug(data, 'RequestData');
    const result: MerchantDocument =
      await this.merchantService.findMerchantMerchantByPhone(data.merchant_hp);
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
        await this.merchantService.createMerchantMerchantProfile(data);
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

  @Put('merchants')
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
      await this.merchantService.findMerchantMerchantByPhone(data.merchant_hp);
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
        await this.merchantService.updateMerchantMerchantProfile(data);
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
        await this.merchantService.deleteMerchantMerchantProfile(id);
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
    const listgroup: any = await this.merchantService.listGroupMerchant(data);
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
    logger.debug(file, 'File');
    const result: StoreDocument =
      await this.merchantService.findMerchantStoreByPhone(data.store_hp);

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
        await this.merchantService.createMerchantStoreProfile(data);
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

  @Put('stores')
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
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const result: StoreDocument =
      await this.merchantService.findMerchantStoreByPhone(data.store_hp);

    if (!result) {
      const errors: RMessage = {
        value: data.store_hp,
        property: 'store_hp',
        constraint: [this.messageService.get('merchant.updategroup.unreg')],
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
        await this.merchantService.updateMerchantStoreProfile(data);
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
        await this.merchantService.deleteMerchantStoreProfile(id);
      const logger = new Logger();
      logger.debug(result.group_name, 'result');
      return this.responseService.success(
        true,
        this.messageService.get('merchant.deletegroup.success'),
      );
    } catch (err) {
      const errors: RMessage = {
        value: err.message,
        property: 'deletegroup',
        constraint: [this.messageService.get('merchant.deletegroup.fail')],
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
    const listgroup: any = await this.merchantService.listGroupStore(data);
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
