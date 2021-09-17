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
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { MerchantsService } from './merchants.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
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
import { UpdateMerchantDTO } from './validation/update_merchant.dto';

@Controller('api/v1/merchants')
export class MerchantsController {
  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly imageValidationService: ImageValidationService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    private readonly storage: CommonStorageService,
  ) {}

  @Post('merchants')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
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
    @Req() req: any,
    @Body()
    createMerchantDTO: CreateMerchantDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    this.imageValidationService
      .setFilter('logo', '')
      .setFilter('profile_store_photo', 'required');
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

    return await this.merchantsService.createMerchantMerchantProfile(
      createMerchantDTO,
    );
  }

  @Put('merchants/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
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
    @Req() req: any,
    @Body()
    updateMerchantDTO: UpdateMerchantDTO,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    await this.imageValidationService.validate(req);
    updateMerchantDTO.id = id;

    if (files && files.length > 0) {
      for (const file of files) {
        const file_name = '/upload_merchants/' + file.filename;
        const url = await this.storage.store(file_name);
        updateMerchantDTO[file.fieldname] = url;
      }
    }
    return await this.merchantsService.updateMerchantMerchantProfile(
      updateMerchantDTO,
    );
  }

  @Delete('merchants/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deletemerchants(@Param('id') id: string): Promise<any> {
    try {
      const result: DeleteResult =
        await this.merchantsService.deleteMerchantMerchantProfile(id);
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

  @Get('merchants')
  @UserTypeAndLevel('admin.*', 'merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getmerchants(@Req() req: any, @Query() data: string[]): Promise<any> {
    let group_id = null;
    if (req.user.user_type == 'merchant' && req.user.level == 'group') {
      group_id = req.user.group_id;
    }
    const listgroup: any = await this.merchantsService.listGroupMerchant(
      data,
      group_id,
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
}
