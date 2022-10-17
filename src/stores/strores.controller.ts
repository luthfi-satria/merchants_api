import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
  UploadedFiles,
  Req,
  UseGuards,
  Logger,
  NotFoundException,
  Res,
  HttpException,
  UploadedFile,
  Headers,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateMerchantStoreValidation } from './validation/create-merchant-stores.validation';
import {
  enumStoreStatus,
  StoreDocument,
} from 'src/database/entities/store.entity';
import {
  editFileName,
  excelFileFilter,
  imageFileFilter,
  imageJpgPngFileFilter,
} from 'src/utils/general-utils';
import { StoresService } from './stores.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { RoleStoreCategoriesGuard } from 'src/auth/store-categories.guard';
import { UpdateStoreCategoriesValidation } from './validation/update-store-categories.validation';
import { RoleStoreGuard } from 'src/auth/store.guard';
import { DeliveryTypeValidation } from './validation/delivery-type.validation';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { UpdateMerchantStoreValidation } from './validation/update-merchant-stores.validation';
import { ListStoreDTO } from './validation/list-store.validation';
import { ResponseExcludeParam } from 'src/response/response_exclude_param.decorator';
import { ResponseExcludeData } from 'src/response/response_exclude_param.interceptor';
import { ViewStoreDetailDTO } from './validation/view-store-detail.validation';
import { Response } from 'express';
import etag from 'etag';
import * as XLSX from 'xlsx';

@Controller('api/v1/merchants')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly imageValidationService: ImageValidationService,
    private readonly storage: CommonStorageService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  @Post('stores')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_stores',
        filename: editFileName,
      }),
      limits: {
        fileSize: 5242880, //5MB
      },
      fileFilter: imageJpgPngFileFilter,
    }),
  )
  async createstores(
    @Req() req: any,
    @Body()
    create_merchant_store_validation: CreateMerchantStoreValidation,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    if (req.user.user_type == 'merchant' && req.user.level == 'merchant')
      create_merchant_store_validation.status =
        enumStoreStatus.waiting_for_approval;
    this.imageValidationService
      .setFilter('photo', 'required')
      .setFilter('banner', 'required');
    await this.imageValidationService.validate(req);
    try {
      for (const file of files) {
        const file_name = '/upload_stores/' + file.filename;
        const url = await this.storage.store(file_name);
        create_merchant_store_validation[file.fieldname] = url;
      }

      const result_db: StoreDocument =
        await this.storesService.createMerchantStoreProfile(
          create_merchant_store_validation,
          req.user,
        );

      await this.storesService.manipulateStoreUrl(result_db);

      return this.responseService.success(
        true,
        this.messageService.get('merchant.createstore.success'),
        result_db,
      );
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  @Put('stores/:id')
  @UserTypeAndLevel(
    'admin.*',
    'merchant.group',
    'merchant.merchant',
    'merchant.store',
  )
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_stores',
        filename: editFileName,
      }),
      limits: {
        fileSize: 5242880, //5MB
      },
      fileFilter: imageFileFilter,
    }),
  )
  async updatestores(
    @Req() req: any,
    @Body()
    update_merchant_store_validation: UpdateMerchantStoreValidation,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    if (req.user.user_type == 'merchant' && req.user.level == 'store') {
      if (req.user.store_id != id) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.UNAUTHORIZED,
            {
              value: req.user.store_id,
              property: 'store_id',
              constraint: [
                this.messageService.get('merchant.general.unauthorizedUser'),
              ],
            },
            'UNAUTHORIZED',
          ),
        );
      }
    }
    update_merchant_store_validation.id = id;
    await this.imageValidationService.validate(req);
    try {
      if (files.length > 0) {
        for (const file of files) {
          const file_name = '/upload_stores/' + file.filename;
          const url = await this.storage.store(file_name);
          update_merchant_store_validation[file.fieldname] = url;
        }
      }
      const updateresult: StoreDocument =
        await this.storesService.updateMerchantStoreProfile(
          update_merchant_store_validation,
          req.user,
        );

      await this.storesService.manipulateStoreUrl(updateresult);

      return this.responseService.success(
        true,
        this.messageService.get('merchant.updatestore.success'),
        updateresult,
      );
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  @Delete('stores/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deletestores(@Param('id') id: string): Promise<any> {
    await this.storesService.deleteMerchantStoreProfile(id);
    return this.responseService.success(
      true,
      this.messageService.get('merchant.deletestore.success'),
    );
  }

  @Get('stores/:id')
  @UserTypeAndLevel('admin.*', 'merchant.*')
  @AuthJwtGuard()
  @ResponseExcludeParam('merchant', 'merchant.group')
  @UseInterceptors(ResponseExcludeData)
  @ResponseStatusCode()
  async viewStoreDetail(
    @Req() req: any,
    @Param('id') id: string,
    @Query() data: ViewStoreDetailDTO,
  ): Promise<any> {
    return this.storesService.viewStoreDetail(id, data, req.user);
  }

  @Get('stores')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getStores(@Req() req: any, @Query() data: ListStoreDTO): Promise<any> {
    try {
      const listgroup: any = await this.storesService.listGroupStore(
        data,
        req.user,
      );
      if (!listgroup) {
        const errors: RMessage = {
          value: '',
          property: 'liststore',
          constraint: [this.messageService.get('merchant.liststore.fail')],
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
        this.messageService.get('merchant.liststore.success'),
        listgroup,
      );
    } catch (error) {
      Logger.error(error);
    }
  }

  @Put('stores/:id/category')
  @UserTypeAndLevel('admin.*', 'merchant.merchant')
  @AuthJwtGuard()
  @UseGuards(RoleStoreCategoriesGuard)
  @ResponseStatusCode()
  async updateStoreCategories(
    @Req() req: any,
    @Body()
    data: Partial<UpdateStoreCategoriesValidation>,
    @Param('id') id: string,
  ): Promise<any> {
    data.store_id = id;
    data.payload = req.payload;
    return this.storesService.updateStoreCategories(data);
  }

  @Put('stores/:store_id/delivery-type')
  @UserTypeAndLevel('admin.*', 'merchant.merchant', 'merchant.store')
  @UseGuards(RoleStoreGuard)
  async getStoresListByDeliveryType(
    @Param('store_id') store_id: string,
    @Body() payload: DeliveryTypeValidation,
  ) {
    try {
      const { delivery_type } = payload;

      const result = await this.storesService
        .findMerchantStoreById(store_id)
        .then(async (item) => {
          if (!item) {
            //Not Found exception
            throw new NotFoundException(
              this.responseService.error(HttpStatus.NOT_FOUND, {
                value: store_id,
                property: 'store_id',
                constraint: [
                  this.messageService.get('merchant.updatestore.id_notfound'),
                ],
              }),
            );
          }

          // quick parsing and update record
          item.delivery_type = delivery_type;

          const updated = await this.storesService.updateStoreProfile(item);
          if (!updated) {
            Logger.warn(
              `Failed to update delivery type merchant $${store_id}`,
              'StoreController',
            );
          }
          await this.storesService.manipulateStoreUrl(updated);

          return item;
        })
        .catch((e) => {
          throw e;
        });

      return this.responseService.success(
        true,
        'Update store tipe delivery sukses!',
        [result],
      );
    } catch (e) {
      throw e;
    }
  }

  @Get('stores/:doc/:id/image/:image')
  async streamFile(
    @Param('id') id: string,
    @Param('doc') doc: string,
    @Param('image') fileName: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const data = { id, doc, fileName };
    let images = null;

    try {
      images = await this.storesService.getStoreBufferS3(data);
    } catch (error) {
      console.error(error);
      throw error;
    }

    const tag = etag(images.buffer);
    if (req.headers['if-none-match'] && req.headers['if-none-match'] === tag) {
      throw new HttpException('Not Modified', HttpStatus.NOT_MODIFIED);
    }

    res.set({
      'Content-Type': images.type + '/' + images.ext,
      'Content-Length': images.buffer.length,
      ETag: tag,
    });

    images.stream.pipe(res);
  }

  @Post('bulk/:merchant_id/upload')
  @UseGuards()
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @ResponseStatusCode()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload_stores',
        filename: editFileName,
      }),
      limits: {
        fileSize: 2000000, //2MB
      },
      fileFilter: excelFileFilter,
    }),
  )
  async bulkCreateMenus(
    @Req() req: any,
    @Param('merchant_id') merchant_id: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    try {
      await this.imageValidationService.validate(req);

      // Get merchant data from Merchant Service
      const isMerchantExist = await this.storesService.findMerchantByMerchantId(
        merchant_id,
        token,
      );

      if (!file) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: null,
              property: 'file',
              constraint: [this.messageService.get('File kosong.')],
            },
            'Bad Request',
          ),
        );
      }
      return this.storesService.uploadStore(
        file.path,
        isMerchantExist,
      );

    } catch (error) {
      throw error;
    }
  }

  //** Download template bulk insert store */
  @Get('/template/stores/:merchant_id')
  @UseGuards()
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @ResponseStatusCode()
  async downloadBulkInsertStoreTemplate(
    @Param('merchant_id') merchant_id: string,
  ): Promise<any> {
    
    if(!merchant_id.length) {
      const errors: RMessage = {
        value: 'merchant_id not_found',
        property: 'merchant_id',
        constraint: [
          this.messageService.get('Gagal mengambil data merchant.')
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
    return this.storesService.downloadBulkInsertStoreTemplate(
      merchant_id,
    );
  } catch (error) {
    throw error;
  }
}
