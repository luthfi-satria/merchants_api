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
  Headers,
  UnauthorizedException,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { RMessage } from 'src/response/response.interface';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MerchantStoreValidation } from './validation/stores.validation';
import { StoreDocument } from 'src/database/entities/store.entity';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';
import { StoresService } from './stores.service';
import { catchError, map } from 'rxjs';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { StoreOperationalService } from './stores-operational.service';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';

@Controller('api/v1/merchants')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly storesOperationalService: StoreOperationalService,
    private readonly merchantService: MerchantsService,
    private readonly imageValidationService: ImageValidationService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post('stores')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_stores',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async createstores(
    @Req() req: any,
    @Body()
    data: MerchantStoreValidation,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    this.imageValidationService
      .setFilter('upload_photo', 'required')
      .setFilter('upload_banner', 'required');
    await this.imageValidationService.validate(req);

    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/validate-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };

    return (await this.storesService.getHttp(url, headersRequest)).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        if (
          response.data.payload.user_type != 'admin' &&
          response.data.payload.user_type != 'merchant' &&
          response.data.payload.level != 'merchant'
        ) {
          const errors: RMessage = {
            value: token.replace('Bearer ', ''),
            property: 'token',
            constraint: [
              this.messageService.get('merchant.creategroup.invalid_token'),
            ],
          };
          throw new UnauthorizedException(
            this.responseService.error(
              HttpStatus.UNAUTHORIZED,
              errors,
              'UNAUTHORIZED',
            ),
          );
        }

        const cekphone: StoreDocument =
          await this.storesService.findMerchantStoreByPhone(data.owner_phone);

        if (cekphone) {
          const errors: RMessage = {
            value: data.owner_phone,
            property: 'owner_phone',
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

        const cekemail: StoreDocument =
          await this.storesService.findMerchantStoreByEmail(data.owner_email);

        if (cekemail) {
          const errors: RMessage = {
            value: data.owner_email,
            property: 'owner_email',
            constraint: [
              this.messageService.get('merchant.createstore.emailExist'),
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
        const cekmerchant: MerchantDocument =
          await this.merchantService.findMerchantById(data.merchant_id);
        if (!cekmerchant) {
          const errors: RMessage = {
            value: data.merchant_id,
            property: 'merchant_id',
            constraint: [
              this.messageService.get(
                'merchant.createstore.merchantid_notfound',
              ),
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
        if (cekmerchant.status != 'ACTIVE') {
          const errors: RMessage = {
            value: data.merchant_id,
            property: 'merchant_id',
            constraint: [
              this.messageService.get(
                'merchant.createstore.merchantid_notactive',
              ),
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
        if (files.length > 0) {
          files.forEach(function (file) {
            data[file.fieldname] = '/upload_stores/' + file.filename;
          });
        }
        const result_db: StoreDocument =
          await this.storesService.createMerchantStoreProfile(data);
        result_db.location_longitude = +result_db.location_longitude;
        result_db.location_latitude = +result_db.location_latitude;
        return this.responseService.success(
          true,
          this.messageService.get('merchant.createstore.success'),
          result_db,
        );
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Put('stores/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_stores',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async updatestores(
    @Req() req: any,
    @Body()
    data: Record<string, any>,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    await this.imageValidationService.validate(req);

    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/validate-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };

    return (await this.storesService.getHttp(url, headersRequest)).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        if (
          response.data.payload.user_type != 'admin' &&
          response.data.payload.user_type != 'merchant' &&
          response.data.payload.level != 'merchant'
        ) {
          const errors: RMessage = {
            value: token.replace('Bearer ', ''),
            property: 'token',
            constraint: [
              this.messageService.get('merchant.creategroup.invalid_token'),
            ],
          };
          throw new UnauthorizedException(
            this.responseService.error(
              HttpStatus.UNAUTHORIZED,
              errors,
              'UNAUTHORIZED',
            ),
          );
        }
        if (files.length > 0) {
          files.forEach(function (file) {
            data[file.fieldname] = '/upload_stores/' + file.filename;
          });
        }
        data.id = id;
        const updateresult: Record<string, any> =
          await this.storesService.updateMerchantStoreProfile(data);
        updateresult.location_longitude = +updateresult.location_longitude;
        updateresult.location_latitude = +updateresult.location_latitude;
        return this.responseService.success(
          true,
          this.messageService.get('merchant.updatestore.success'),
          updateresult,
        );
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Delete('stores/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deletestores(
    @Param('id') id: string,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/validate-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };

    return (await this.storesService.getHttp(url, headersRequest)).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        if (response.data.payload.user_type != 'admin') {
          const errors: RMessage = {
            value: token.replace('Bearer ', ''),
            property: 'token',
            constraint: [
              this.messageService.get('merchant.createmerchant.invalid_token'),
            ],
          };
          throw new UnauthorizedException(
            this.responseService.error(
              HttpStatus.UNAUTHORIZED,
              errors,
              'UNAUTHORIZED',
            ),
          );
        }
        await this.storesService.deleteMerchantStoreProfile(id);
        return this.responseService.success(
          true,
          this.messageService.get('merchant.deletestore.success'),
        );
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Get('stores')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getsores(
    @Query() data: string[],
    @Headers('Authorization') token: string,
  ): Promise<any> {
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [this.messageService.get('merchant.general.invalid_token')],
      };
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'UNAUTHORIZED',
        ),
      );
    }

    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/validate-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };
    const merchant: Record<string, string> = {
      user_type: '',
      id: '',
    };
    return (await this.storesService.getHttp(url, headersRequest)).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        if (
          response.data.payload.user_type != 'admin' &&
          response.data.payload.user_type != 'merchant' &&
          response.data.payload.level != 'merchant'
        ) {
          const errors: RMessage = {
            value: token.replace('Bearer ', ''),
            property: 'token',
            constraint: [
              this.messageService.get('merchant.general.invalid_token'),
            ],
          };
          throw new UnauthorizedException(
            this.responseService.error(
              HttpStatus.UNAUTHORIZED,
              errors,
              'UNAUTHORIZED',
            ),
          );
        }
        if (response.data.payload.level == 'merchant') {
          merchant.user_type = 'merchant';
          merchant.id = response.data.payload.merchant_id;
        }
        const listgroup: any = await this.storesService.listGroupStore(
          data,
          merchant,
        );
        if (!listgroup) {
          const errors: RMessage = {
            value: '',
            property: 'listgroup',
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
      }),
    );
  }
}
