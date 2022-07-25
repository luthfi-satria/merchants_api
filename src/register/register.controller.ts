import {
  BadRequestException,
  Post,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { RegistersService } from './register.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { GroupsService } from 'src/groups/groups.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { editFileName, imageAndPdfFileFilter } from 'src/utils/general-utils';
import { RegisterCorporateDto } from './dto/register-corporate.dto';
import {
  CategoryGroup,
  GroupDocument,
} from 'src/database/entities/group.entity';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { CreateGroupDTO } from 'src/groups/validation/create_groups.dto';

@Controller('api/v1/merchants')
export class RegistersController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly registersService: RegistersService,
    private readonly imageValidationService: ImageValidationService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly storageService: CommonStorageService,
  ) {}

  @Post('register')
  @ResponseStatusCode()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_registers',
        filename: editFileName,
      }),
      limits: {
        fileSize: 2000000, //2MB
      },
      fileFilter: imageAndPdfFileFilter,
    }),
  )
  async registerCorporate(
    @Req() req: any,
    @Body() registerCorporateDto: RegisterCorporateDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      // create groups/corporate
      if (registerCorporateDto.category == CategoryGroup.COMPANY) {
        this.imageValidationService.setFilter('siup_file', 'required');
        this.imageValidationService.setFilter(
          'akta_pendirian_file',
          'required',
        );
        this.imageValidationService.setFilter('npwp_file', 'required');
      } else if (registerCorporateDto.category == CategoryGroup.PERSONAL) {
        this.imageValidationService.setFilter(
          'director_id_face_file',
          'required',
        );
      }

      this.imageValidationService.setFilter('director_id_file', 'required');
      await this.imageValidationService.validate(req);

      this.imageValidationService
        .setFilter('logo', '')
        .setFilter('profile_store_photo', '');
      if (registerCorporateDto.pb1 == 'true')
        this.imageValidationService.setFilter('npwp_file', 'required');
      await this.imageValidationService.validate(req);

      const group = await this.groupsService.findGroupByPhone(
        registerCorporateDto.phone,
      );
      if (group) {
        const errors: RMessage = {
          value: registerCorporateDto.phone,
          property: 'phone',
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

      for (const file of files) {
        const file_name = '/upload_registers/' + file.filename;
        const url = await this.storageService.store(file_name);
        registerCorporateDto[file.fieldname] = url;
      }

      // for (const file of files) {
      //   console.log(file);
      //   let file_name: string = '';
      //   let url: string = '';
      //   // const file_name = '/upload_registers/' + file.filename;
      //   if (
      //     file.fieldname === 'siup_file' ||
      //     file.filename === 'akta_pendirian_file' ||
      //     file.filename === 'akta_perubahan_file' ||
      //     file.filename === 'npwp_file' ||
      //     file.filename === 'director_id_file' ||
      //     file.filename === 'director_id_face_file'
      //   ) {
      //     console.log('filename', file_name);
      //     file_name = '/upload_registers/' + file.filename;
      //     url = await this.storageService.store(file_name);
      //     registerCorporateDto[file.fieldname] = url;
      //     file_name = '';
      //     console.log('filename', file_name);
      //   }

      //   if (
      //     file.fieldname === 'logo' ||
      //     file.fieldname === 'profile_store_photo' ||
      //     file.fieldname === 'npwp_file'
      //   ) {
      //     file_name = '/upload_merchants/' + file.filename;
      //     url = await this.storageService.store(file_name);
      //     registerCorporateDto[file.fieldname] = url;
      //     file_name = '';
      //   }

      //   if (file.fieldname === 'photo' || file.fieldname === 'banner') {
      //     file_name = '/upload_stores/' + file.filename;
      //     url = await this.storageService.store(file_name);
      //     registerCorporateDto[file.fieldname] = url;
      //     file_name = '';
      //   }
      // }

      const createCorporate = await this.registersService.registerCorporate(
        registerCorporateDto,
      );

      return this.responseService.success(
        true,
        this.messageService.get('merchant.creategroup.success'),
        createCorporate,
      );
    } catch (error) {
      // console.log(error);
      throw error;
    }
  }
}
