import {
  BadRequestException,
  Post,
  Body,
  Controller,
  HttpStatus,
  Req,
  UploadedFiles,
  UseInterceptors,
  Put,
  Param,
  Get,
} from '@nestjs/common';
import { RegistersService } from './register.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { GroupsService } from 'src/groups/groups.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { editFileName, imageAndPdfFileFilter } from 'src/utils/general-utils';
import { RegisterCorporateDto } from './dto/register-corporate.dto';
import { CategoryGroup } from 'src/database/entities/group.entity';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { GroupUsersService } from 'src/groups/group_users.service';
import { RegisterCorporateOTPDto } from './dto/register-corporate-otp.dto';
import { AuthInternalService } from '../internal/auth-internal.service';
import { RegisterCorporateVerifyOtpDto } from './dto/register-corporate-verify-otp.dto';
import { UpdateCorporateDto } from '../groups/validation/update-corporate.dto';
import { MerchantStatus } from '../database/entities/merchant.entity';

@Controller('api/v1/merchants')
export class RegistersController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupsUsersService: GroupUsersService,
    private readonly registersService: RegistersService,
    private readonly imageValidationService: ImageValidationService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly storageService: CommonStorageService,
    private readonly authInternalService: AuthInternalService,
  ) {}

  @Get('group/register/update/:id')
  @ResponseStatusCode()
  async getDetailCorporate(@Param('id') groupId: string) {
    const checkGroup = await this.groupsService.viewGroupDetailNoUser(groupId);

    if (!checkGroup) {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get('merchant.general.dataNotFound')],
      };

      throw new BadRequestException(
        this.responseService.error(HttpStatus.NOT_FOUND, errors, 'Bad Request'),
      );
    }

    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      checkGroup.data,
    );
  }

  @Post('/group/register/otp')
  @ResponseStatusCode()
  async registerCorporateOtp(@Body() otpDto: RegisterCorporateOTPDto) {
    console.log('GENERATE OTP');

    await this.validation(otpDto, otpDto.group_id);

    try {
      console.log('VALIDATION');

      await this.authInternalService.generateOtp({
        phone: otpDto.director_phone,
        group_id: otpDto.group_id,
        user_type: otpDto.group_id ? 'registration' : 'update_corporate',
      });

      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
        null,
      );
    } catch (e) {
      console.log(e);

      throw new BadRequestException(e.message);
    }
  }

  @Post('/group/register/verify/otp')
  @ResponseStatusCode()
  async registerCorporateVerifyOtp(
    @Body() otpDto: RegisterCorporateVerifyOtpDto,
  ) {
    try {
      await this.authInternalService.verifyOtp({
        otp_code: otpDto?.otp_code,
        phone: otpDto?.phone,
        user_type: 'registration',
        roles: null,
        created_at: new Date(),
      });

      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
        null,
      );
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('/group/register')
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

      // create group process

      await this.validation({
        group_id: undefined,
        phone: registerCorporateDto.phone,
        name: registerCorporateDto.name,
        director_email: registerCorporateDto.director_email,
        pic_finance_email: registerCorporateDto.pic_finance_email,
        pic_operational_email: registerCorporateDto.pic_operational_email,
        director_phone: registerCorporateDto.director_phone,
        pic_finance_phone: registerCorporateDto.pic_finance_phone,
        pic_operational_phone: registerCorporateDto.pic_operational_phone,
      });

      await this.authInternalService.verifyOtp({
        otp_code: registerCorporateDto.otp_code,
        phone: registerCorporateDto.director_phone,
        user_type: 'registration',
        roles: null,
        created_at: new Date(),
        group_id: null,
      });

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

  async validation(data: RegisterCorporateOTPDto, groupId: string = null) {
    let checkGroup = null;

    if (groupId) {
      checkGroup = await this.groupsService.viewGroupDetailNoUser(groupId);
    }

    if (data.name !== checkGroup?.data?.name) {
      await this.groupsService.validateGroupUniqueName(data.name);
    }

    if (data.phone !== checkGroup?.data?.phone) {
      await this.groupsService.validateGroupUniquePhone(data.phone);
    }

    if (data.director_email !== checkGroup?.data?.director_email) {
      await this.groupsUsersService.validateGroupUserUniqueEmail(
        data.director_email,
        null,
        'director_email',
      );
    }

    if (data.pic_finance_email !== checkGroup?.data?.pic_finance_email) {
      await this.groupsUsersService.validateGroupUserUniqueEmail(
        data.pic_finance_email,
        null,
        'pic_finance_email',
      );
    }

    if (
      data.pic_operational_email !== checkGroup?.data?.pic_operational_email
    ) {
      await this.groupsUsersService.validateGroupUserUniqueEmail(
        data.pic_operational_email,
        null,
        'pic_operational_email',
      );
    }

    if (data.director_phone !== checkGroup?.data?.director_phone) {
      await this.groupsUsersService.validateGroupUserUniquePhone(
        data.director_phone,
        null,
        'director_phone',
      );
    }

    if (data.pic_finance_phone !== checkGroup?.data?.pic_finance_phone) {
      await this.groupsUsersService.validateGroupUserUniquePhone(
        data.pic_finance_phone,
        null,
        'pic_finance_phone',
      );
    }

    if (
      data.pic_operational_phone !== checkGroup?.data?.pic_operational_phone
    ) {
      await this.groupsUsersService.validateGroupUserUniquePhone(
        data.pic_operational_phone,
        null,
        'pic_operational_phone',
      );
    }
  }

  @Put('group/register/update/:groupId')
  @ResponseStatusCode()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_groups',
        filename: editFileName,
      }),
      limits: {
        fileSize: 5242880, //5MB
      },
      fileFilter: imageAndPdfFileFilter,
    }),
  )
  async updateCorporate(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Body() updateCorporateDto: UpdateCorporateDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const checkGroup = await this.groupsService.viewGroupDetailNoUser(groupId);

    if (!checkGroup) {
      const errors: RMessage = {
        value: '',
        property: 'phone',
        constraint: [this.messageService.get('merchant.general.dataNotFound')],
      };

      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    if (checkGroup.data.status !== MerchantStatus.Rejected) {
      const errors: RMessage = {
        value: '',
        property: 'phone',
        constraint: [
          this.messageService.get('merchant.updategroup.status_not_rejected'),
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

    if (updateCorporateDto.name !== checkGroup.data.name) {
      await this.groupsService.validateGroupUniqueName(updateCorporateDto.name);
    }

    if (updateCorporateDto.phone !== checkGroup.data.phone) {
      await this.groupsService.validateGroupUniquePhone(
        updateCorporateDto.phone,
      );
    }

    if (updateCorporateDto.director_email !== checkGroup.data.director_email) {
      await this.groupsUsersService.validateGroupUserUniqueEmail(
        updateCorporateDto.director_email,
        null,
        'director_email',
      );
    }

    if (
      updateCorporateDto.pic_finance_email !== checkGroup.data.pic_finance_email
    ) {
      await this.groupsUsersService.validateGroupUserUniqueEmail(
        updateCorporateDto.pic_finance_email,
        null,
        'pic_finance_email',
      );
    }

    if (
      updateCorporateDto.pic_operational_email !==
      checkGroup.data.pic_operational_email
    ) {
      await this.groupsUsersService.validateGroupUserUniqueEmail(
        updateCorporateDto.pic_operational_email,
        null,
        'pic_operational_email',
      );
    }

    if (updateCorporateDto.director_phone !== checkGroup.data.director_phone) {
      await this.groupsUsersService.validateGroupUserUniquePhone(
        updateCorporateDto.director_phone,
        null,
        'director_phone',
      );
    }

    if (
      updateCorporateDto.pic_finance_phone !== checkGroup.data.pic_finance_phone
    ) {
      await this.groupsUsersService.validateGroupUserUniquePhone(
        updateCorporateDto.pic_finance_phone,
        null,
        'pic_finance_phone',
      );
    }

    if (
      updateCorporateDto.pic_operational_phone !==
      checkGroup.data.pic_operational_phone
    ) {
      await this.groupsUsersService.validateGroupUserUniquePhone(
        updateCorporateDto.pic_operational_phone,
        null,
        'pic_operational_phone',
      );
    }

    if (files) {
      for (const file of files) {
        const file_name = '/upload_groups/' + file.filename;
        const url = await this.storageService.store(file_name);
        updateCorporateDto[file.fieldname] = url;
      }
    }

    await this.authInternalService.verifyOtp({
      otp_code: updateCorporateDto.otp_code,
      phone: updateCorporateDto.director_phone,
      user_type: 'registration',
      roles: null,
      created_at: new Date(),
      group_id: updateCorporateDto.id,
    });

    await this.groupsService.updateCorporate(
      checkGroup.data,
      updateCorporateDto,
    );

    const viewGroupDetail = await this.groupsService.viewGroupDetail(
      checkGroup.data.id,
      req.user,
    );

    return this.responseService.success(
      true,
      this.messageService.get('merchant.updategroup.success'),
      viewGroupDetail.data,
    );
  }
}
