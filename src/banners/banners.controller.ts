import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Put,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { BannersService } from './banners.service';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { BannersDto } from './dto/banners.dto';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { RMessage } from 'src/response/response.interface';
import {
  UpdateBannerByMerchantIdDto,
  UpdateBannerByStoreIdDto,
} from './dto/update-banner.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageJpgPngFileFilter } from 'src/utils/general-utils';

@Controller('/api/v1/merchants/banners')
export class BannersController {
  constructor(
    private readonly bannersService: BannersService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    private readonly storage: CommonStorageService,
  ) {}

  @Put()
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_stores',
        filename: editFileName,
      }),
      limits: {
        fileSize: 2000000, //2MB
      },
      fileFilter: imageJpgPngFileFilter,
    }),
  )
  async updateBannerAdmin(
    @Req() req: any,
    @Body() data: BannersDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    if (files.length > 0) {
      for (const file of files) {
        const file_name = '/upload_stores/' + file.filename;
        const url = await this.storage.store(file_name);
        data[file.fieldname] = url;
      }
    }
    if (data.all) {
      if (data.merchant_id) {
        const updateBannerDto = new UpdateBannerByMerchantIdDto();
        updateBannerDto.banner = data.banner;
        updateBannerDto.merchant_id = data.merchant_id;
        const result = await this.bannersService.updateBannerByMerchantId(
          updateBannerDto,
        );
        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
          result,
        );
      } else {
        const errors: RMessage = {
          value: data.merchant_id,
          property: 'Merchant Id',
          constraint: [this.messageService.get('merchant.general.idNotFound')],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      }
    } else {
      const collection = [];
      const updateBannerDto = new UpdateBannerByStoreIdDto();
      updateBannerDto.banner = data.banner;
      for (const item of data.store_ids) {
        updateBannerDto.store_id = item;
        const result = await this.bannersService.updateBannerByStoreId(
          updateBannerDto,
        );
        if (result) {
          collection.push(result);
        }
      }
      if (collection.length > 0) {
        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
          collection,
        );
      }
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          null,
          'Something Error, Please Call Administrator',
        ),
      );
    }
  }
}
