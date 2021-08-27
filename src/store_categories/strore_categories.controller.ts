import {
  Body,
  Controller,
  Post,
  Headers,
  UnauthorizedException,
  HttpStatus,
  BadRequestException,
  Put,
  Param,
  Delete,
  Get,
  Query,
  UseInterceptors,
  Req,
  UploadedFile,
} from '@nestjs/common';
import { RequestValidationPipe } from 'src/utils/request-validation.pipe';
import { catchError, lastValueFrom, map } from 'rxjs';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { isUUID } from 'class-validator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';
import { StoreCategoriesValidation } from './validation/store_categories.validation.dto';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { StoreCategoriesService } from './store_categories.service';

@Controller('api/v1/merchants')
export class StoreCategoriesController {
  constructor(
    private readonly storeCategoriesService: StoreCategoriesService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    private readonly imageValidationService: ImageValidationService,
  ) {}

  @Post('store-categories')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './upload_store_categories',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async createmenusstores(
    @Req() req: any,
    @Body(RequestValidationPipe(StoreCategoriesValidation))
    data: StoreCategoriesValidation,
    @UploadedFile() file: Express.Multer.File,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    this.imageValidationService.setFilter('image', 'required');
    await this.imageValidationService.validate(req);

    if (!file) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: null,
            property: 'image',
            constraint: [
              this.messageService.get('merchant.general.empty_photo'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    data.image = '/upload_store_categories/' + file.filename;

    return await this.validatePermission('create', token, data);
  }

  @Put('store-categories/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './upload_store_categories',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async updatemenusStores(
    @Req() req: any,
    @Body()
    data: Partial<StoreCategoriesValidation>,
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    data.id = id;
    await this.imageValidationService.validate(req);
    if (file) data.image = '/upload_store_categories/' + file.filename;

    return await this.validatePermission('update', token, data);
  }

  @Delete('store-categories/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deleteMenusStores(
    @Param('id') id: string,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    const cekuuid = isUUID(id);

    if (!cekuuid) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: id,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.general.invalidUUID'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    return await this.validatePermission('delete', token, { id: id });
  }

  @Get('store-categories')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getMenusStores(
    @Query() data: Partial<StoreCategoriesValidation>,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    return await this.validatePermission('get', token, data);
  }

  //-------------------------------------------------------------------------------------

  async validatePermission(
    method: string,
    token: string,
    data: StoreCategoriesValidation | Partial<StoreCategoriesValidation>,
  ): Promise<any> {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/validate-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };
    const validateToken$ = (
      await this.storeCategoriesService.getHttp(url, headersRequest)
    ).pipe(
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

        const user_type = rsp.data.payload.user_type;
        let permission = false;

        if (user_type == 'admin') {
          permission = true;
        }
        if (!permission) {
          throw new UnauthorizedException(
            this.responseService.error(
              HttpStatus.UNAUTHORIZED,
              {
                value: token.replace('Bearer ', ''),
                property: 'token',
                constraint: [
                  this.messageService.get('catalog.general.invalidUserAccess'),
                ],
              },
              'UNAUTHORIZED',
            ),
          );
        }
        return rsp.data.payload;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
    await lastValueFrom(validateToken$);
    switch (method) {
      case 'create':
        return await this.storeCategoriesService.createStoreCategories(data);
      case 'update':
        return await this.storeCategoriesService.updateStoreCategories(data);
      case 'delete':
        return await this.storeCategoriesService.deleteStoreCategories(data.id);
      case 'get':
        return await this.storeCategoriesService.listStoreCategories(data);
    }
  }
}
