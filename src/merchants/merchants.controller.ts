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
  UploadedFiles,
  UseInterceptors,
  Req,
  ForbiddenException,
  Logger,
  Res,
  HttpException,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { MerchantsService } from './merchants.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateMerchantDTO } from './validation/create_merchant.dto';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';
import { DeleteResult } from 'typeorm';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { CommonStorageService } from 'src/common/storage/storage.service';
import {
  UpdateMerchantDTO,
  UpdateStoreSettingsDTO,
} from './validation/update_merchant.dto';
import { ListMerchantDTO } from './validation/list-merchant.validation';
import { ResponseExcludeParam } from 'src/response/response_exclude_param.decorator';
import { ResponseExcludeData } from 'src/response/response_exclude_param.interceptor';
import { MerchantStatus } from 'src/database/entities/merchant.entity';
import { Response } from 'express';
import etag from 'etag';
@Controller('api/v1/merchants')
export class MerchantsController {
  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly imageValidationService: ImageValidationService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly storage: CommonStorageService,
  ) {}

  logger = new Logger('MerchantController');

  @Post('merchants')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_merchants',
        filename: editFileName,
      }),
      limits: {
        fileSize: 5242880, //5MB
      },
      fileFilter: imageFileFilter,
    }),
  )
  async createmerchants(
    @Req() req: any,
    @Body()
    createMerchantDTO: CreateMerchantDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    if (req.user.level == 'group') {
      createMerchantDTO.status = MerchantStatus.Waiting_for_approval;
    }
    this.imageValidationService
      .setFilter('logo', '')
      .setFilter('profile_store_photo', '');
    if (createMerchantDTO.pb1 == 'true')
      this.imageValidationService.setFilter('npwp_file', 'required');
    await this.imageValidationService.validate(req);

    if (files.length > 0) {
      for (const file of files) {
        const file_name = '/upload_merchants/' + file.filename;
        const url = await this.storage.store(file_name);
        createMerchantDTO[file.fieldname] = url;
      }
    }

    return this.merchantsService.createMerchantMerchantProfile(
      createMerchantDTO,
      req.user,
    );
  }

  @Put('merchants/:id')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_merchants',
        filename: editFileName,
      }),
      limits: {
        fileSize: 5242880, //5MB
      },
      fileFilter: imageFileFilter,
    }),
  )
  async updatemerchants(
    @Req() req: any,
    @Body()
    updateMerchantDTO: UpdateMerchantDTO,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    if (req.user.level == 'merchant' && req.user.merchant_id != id) {
      this.logger.error('This user does not belong to the merchant');
      const errors: RMessage = {
        value: id,
        property: 'merchant_id',
        constraint: [this.messageService.get('auth.token.forbidden')],
      };
      throw new ForbiddenException(
        this.responseService.error(
          HttpStatus.FORBIDDEN,
          errors,
          'Forbidden Access',
        ),
      );
    }

    await this.imageValidationService.validate(req);
    updateMerchantDTO.id = id;

    if (files && files.length > 0) {
      for (const file of files) {
        const file_name = '/upload_merchants/' + file.filename;
        const url = await this.storage.store(file_name);
        updateMerchantDTO[file.fieldname] = url;
      }
    }
    return this.merchantsService.updateMerchantMerchantProfile(
      updateMerchantDTO,
    );
  }

  @Put('store-settings/:id')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updatePosSettings(
    @Body()
    updatePostSettingsDTO: UpdateStoreSettingsDTO,
    @Param('id') id: string,
  ): Promise<any> {
    return this.merchantsService.updatePostSettings(updatePostSettingsDTO, id);
  }

  @Delete('merchants/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deletemerchants(@Param('id') id: string): Promise<any> {
    try {
      const result: DeleteResult =
        await this.merchantsService.deleteMerchantMerchantProfile(id);

      console.log(result);

      if (result.raw.length == 0 && result.affected == 0) {
        const errors: RMessage = {
          value: id,
          property: 'id',
          constraint: [
            this.messageService.get('merchant.deletemerchant.invalid_id'),
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
      return this.responseService.success(
        true,
        this.messageService.get('merchant.deletemerchant.success'),
      );
    } catch (err) {
      const errors: RMessage = {
        value: id,
        property: 'id',
        constraint: [err.message],
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

  @Get('merchants/:id')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseExcludeParam('group')
  @UseInterceptors(ResponseExcludeData)
  @ResponseStatusCode()
  async viewMerchant(@Req() req: any, @Param('id') id: string): Promise<any> {
    return this.merchantsService.viewMerchantDetail(id, req.user);
  }

  @Get('merchants')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getmerchants(
    @Req() req: any,
    @Query() data: ListMerchantDTO,
  ): Promise<any> {
    const listgroup: any = await this.merchantsService.listGroupMerchant(
      data,
      req.user,
    );
    if (!listgroup) {
      const errors: RMessage = {
        value: '',
        property: '',
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
      this.messageService.get('merchant.listmerchant.success'),
      listgroup,
    );
  }

  @Get('merchants/:doc/:id/image/:image')
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
      images = await this.merchantsService.getMerchantBufferS3(data);
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
}
