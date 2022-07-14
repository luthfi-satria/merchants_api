import {
  Body,
  Controller,
  Post,
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
  Res,
  HttpException,
} from '@nestjs/common';
import { RequestValidationPipe } from 'src/utils/request-validation.pipe';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { isUUID } from 'class-validator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';
import { StoreCategoriesValidation } from './validation/store_categories.validation.dto';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { StoreCategoriesService } from './store_categories.service';
import { RSuccessMessage } from 'src/response/response.interface';
import { Response } from 'express';
import etag from 'etag';
import { CommonStorageService } from 'src/common/storage/storage.service';

@Controller('api/v1/merchants')
export class StoreCategoriesController {
  constructor(
    private readonly storeCategoriesService: StoreCategoriesService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly imageValidationService: ImageValidationService,
    private readonly storage: CommonStorageService,
  ) {}

  @Post('store/categories')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './upload_store_categories',
        filename: editFileName,
      }),
      limits: {
        fileSize: 5242880,//5MB
      },
      fileFilter: imageFileFilter,
    }),
  )
  async createStoreCategory(
    @Req() req: any,
    @Body(RequestValidationPipe(StoreCategoriesValidation))
    data: StoreCategoriesValidation,
    @UploadedFile() file: Express.Multer.File,
    // @Headers('Authorization') token: string,
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

    return this.storeCategoriesService.createStoreCategories(data);
  }

  @Put('store/categories/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './upload_store_categories',
        filename: editFileName,
      }),
      limits: {
        fileSize: 5242880,//5MB
      },
      fileFilter: imageFileFilter,
    }),
  )
  async updateStoreCategories(
    @Req() req: any,
    @Body()
    data: Partial<StoreCategoriesValidation>,
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    // @Headers('Authorization') token: string,
  ): Promise<any> {
    data.id = id;
    await this.imageValidationService.validate(req);
    if (file) data.image = '/upload_store_categories/' + file.filename;

    return this.storeCategoriesService.updateStoreCategories(data);
  }

  @Delete('store/categories/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deleteStoreCategories(@Param('id') id: string): Promise<any> {
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
    return this.storeCategoriesService.deleteStoreCategories(id);
  }

  @Get('store/categories')
  @UserType('admin', 'merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getStoreCategories(
    @Req() req: any,
    @Query() data: Partial<StoreCategoriesValidation>,
  ): Promise<any> {
    return this.storeCategoriesService.listStoreCategories(data);
  }

  @Get('store/categories/:scid')
  @UserType('admin', 'merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async viewDetailStoreCategories(
    @Param('scid') store_category_id: string,
  ): Promise<RSuccessMessage> {
    return this.storeCategoriesService.viewDetailStoreCategory(
      store_category_id,
    );
  }

  @Get('store/categories/:id/image/:image')
  async streamFile(
    @Param('id') id: string,
    @Param('doc') doc: string,
    @Param('image') fileName: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const data = { id, fileName };
    let images = null;

    try {
      images = await this.storeCategoriesService.getStoreCategoryBufferS3(data);
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
