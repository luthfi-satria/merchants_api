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
  UploadedFile,
  UseInterceptors,
  Headers,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { RMessage } from 'src/response/response.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MerchantStoreValidation } from './validation/stores.validation';
import { StoreDocument } from 'src/database/entities/store.entity';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';
import { StoresService } from './stores.service';
import { RequestValidationPipe } from 'src/utils/request-validation.pipe';
import { catchError, map } from 'rxjs';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { StoreLoginEmailValidation } from './validation/store.login.email.validation';
import { StoreLoginPhoneValidation } from './validation/store.login.phone.validation';

@Controller('api/v1/merchants')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly merchantService: MerchantsService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post('stores')
  @ResponseStatusCode()
  @UseInterceptors(
    FileInterceptor('upload_photo', {
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
    @Headers('Authorization') token: string,
  ): Promise<any> {
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.creategroup.invalid_token'),
        ],
      };
      throw new BadRequestException(
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
          response.data.payload.user_type != 'merchant'
        ) {
          const errors: RMessage = {
            value: token.replace('Bearer ', ''),
            property: 'token',
            constraint: [
              this.messageService.get('merchant.creategroup.invalid_token'),
            ],
          };
          throw new BadRequestException(
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
        if (!file) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: null,
                property: 'upload_photo',
                constraint: [
                  this.messageService.get('merchant.createstore.empty_photo'),
                ],
              },
              'Bad Request',
            ),
          );
        }
        data.upload_photo = '/upload_stores/' + file.filename;
        const result_db: StoreDocument =
          await this.storesService.createMerchantStoreProfile(data);
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
  @ResponseStatusCode()
  @UseInterceptors(
    FileInterceptor('upload_photo', {
      storage: diskStorage({
        destination: './upload_stores',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async updatestores(
    @Body()
    data: Record<string, any>,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.creategroup.invalid_token'),
        ],
      };
      throw new BadRequestException(
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
          response.data.payload.user_type != 'merchant'
        ) {
          const errors: RMessage = {
            value: token.replace('Bearer ', ''),
            property: 'token',
            constraint: [
              this.messageService.get('merchant.creategroup.invalid_token'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.UNAUTHORIZED,
              errors,
              'UNAUTHORIZED',
            ),
          );
        }
        if (file) data.upload_photo = '/upload_stores/' + file.filename;

        data.id = id;
        const updateresult: Record<string, any> =
          await this.storesService.updateMerchantStoreProfile(data);
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
  @ResponseStatusCode()
  async deletestores(
    @Param('id') id: string,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.createmerchant.invalid_token'),
        ],
      };
      throw new BadRequestException(
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
          throw new BadRequestException(
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
  @ResponseStatusCode()
  async getsores(@Query() data: string[]): Promise<any> {
    const listgroup: any = await this.storesService.listGroupStore(data);
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

  @Post('stores/login/email')
  @ResponseStatusCode()
  async loginByEmail(
    @Body(RequestValidationPipe(StoreLoginEmailValidation))
    data: StoreLoginEmailValidation,
  ): Promise<any> {
    data.access_type = 'email';
    return await this.storesService.loginProcess(data);
  }

  @Post('stores/login/phone')
  @ResponseStatusCode()
  async loginByPhone(
    @Body(RequestValidationPipe(StoreLoginPhoneValidation))
    data: StoreLoginPhoneValidation,
  ): Promise<any> {
    data.access_type = 'phone';
    return await this.storesService.loginProcess(data);
  }
}
