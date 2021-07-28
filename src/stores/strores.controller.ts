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
  Headers,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
// import { RequestValidationPipe } from './validation/request-validation.pipe';
import { RMessage } from 'src/response/response.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MerchantStoreValidation } from './validation/stores.validation';
import { StoreDocument } from 'src/database/entities/store.entity';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';
import { StoresService } from './stores.service';
import { RequestValidationPipe } from 'src/utils/request-validation.pipe';
import { catchError, map } from 'rxjs';

@Controller('api/v1/merchants')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService, // private httpService: HttpService,
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
    const logger = new Logger();
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
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
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
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
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
        try {
          logger.debug(file, 'file');
          if (file) data.upload_photo = '/upload_stores/' + file.filename;
          const result_db: StoreDocument =
            await this.storesService.createMerchantStoreProfile(data);
          return this.responseService.success(
            true,
            this.messageService.get('merchant.createstore.success'),
            result_db,
          );
        } catch (err) {
          const errors: RMessage = {
            value: err.message,
            property: '',
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
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Put('stores/:id')
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
    @Body(RequestValidationPipe(MerchantStoreValidation))
    data: MerchantStoreValidation,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const result: StoreDocument = await this.storesService.findMerchantById(id);

    if (!result) {
      const errors: RMessage = {
        value: data.owner_phone,
        property: 'owner_phone',
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
    data.store_id = result.store_id;
    try {
      if (file) data.upload_photo = '/upload_stores/' + file.filename;
      const updateresult: Record<string, any> =
        await this.storesService.updateMerchantStoreProfile(data);
      return this.responseService.success(
        true,
        this.messageService.get('merchant.updatestore.success'),
        updateresult,
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
      // const result: StoreDocument =
      await this.storesService.deleteMerchantStoreProfile(id);
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
