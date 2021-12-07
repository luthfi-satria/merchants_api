import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ProfileService } from './profile.service';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import {
  OtpDto,
  ResponseMerchantDto,
  UbahEmailDto,
  UpdateEmailDto,
  UpdatePhoneDto,
  VerifikasiUbahEmailDto,
  VerifikasiUbahPhoneDto,
} from './validation/profile.dto';
import { RMessage } from 'src/response/response.interface';
import { catchError, map } from 'rxjs';

@Controller('api/v1/merchants')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService, // private httpService: HttpService,
  ) {}

  @Post('profile/verify-email')
  @UserType('merchant')
  @AuthJwtGuard()
  async updateEmail(@Req() req: any, @Body() data: UbahEmailDto) {
    return this.profileService.ubahEmail(data, req.user);
  }

  @Post('profile/verify-email/resend')
  @UserType('merchant')
  @AuthJwtGuard()
  async resendEmailUser(@Req() req: any) {
    return this.profileService.resendEmailUser(req.user.id);
  }

  @Post('verifications/email')
  async verifikasiUbahEmail(@Body() data: VerifikasiUbahEmailDto) {
    return this.profileService.verifikasiUbahEmail(data);
  }

  @Post('verifications/phone')
  async phoneVerification(@Body() data: VerifikasiUbahPhoneDto) {
    return this.profileService.verifikasiUbahTelepon(data);
  }

  @Post('profile/verify-email-validation')
  @UserType('merchant')
  @AuthJwtGuard()
  async updateEmailValidation(@Req() req: any, @Body() data: UpdateEmailDto) {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-email-validation';
    const defaultJsonHeader: Record<string, any> = {
      'Content-Type': 'application/json',
    };
    const existEmail = await this.profileService.findOneMerchantByEmail(
      data.email,
    );
    if (existEmail) {
      const errors: RMessage = {
        value: data.email,
        property: 'email',
        constraint: [this.messageService.get('merchant.general.emailExist')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    const userData = await this.profileService.findOneById(req.user.id);
    const otpDto = new OtpDto();
    otpDto.email = data.email;
    otpDto.otp_code = data.otp_code;
    otpDto.id = userData.id;
    otpDto.user_type = 'merchant';
    return (
      await this.profileService.postHttp(url, otpDto, defaultJsonHeader)
    ).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.success) {
          data.id = userData.id;
          const updateResult = await this.profileService.updateEmail(data);
          const responseMerchantDataDto = new ResponseMerchantDto();
          responseMerchantDataDto.id = updateResult.id;
          responseMerchantDataDto.name = updateResult.name;
          responseMerchantDataDto.email = updateResult.email;
          responseMerchantDataDto.phone = updateResult.phone;
          responseMerchantDataDto.group_id = updateResult.group_id;
          responseMerchantDataDto.merchant_id = updateResult.merchant_id;
          responseMerchantDataDto.nip = updateResult.nip;
          responseMerchantDataDto.created_at = updateResult.created_at;
          responseMerchantDataDto.updated_at = updateResult.updated_at;
          responseMerchantDataDto.deleted_at = updateResult.deleted_at;
          responseMerchantDataDto.store = updateResult.store;
          responseMerchantDataDto.merchant = updateResult.merchant;
          responseMerchantDataDto.group = updateResult.group;
          return this.responseService.success(
            true,
            this.messageService.get('merchant.general.success'),
            responseMerchantDataDto,
          );
        }
        return response;
      }),
      catchError((err) => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            err.response.data,
            'Bad Request',
          ),
        );
      }),
    );
  }

  @Post('profile/verify-phone')
  @UserType('merchant')
  @AuthJwtGuard()
  async updatePhone(@Req() req: any, @Body() data: UpdatePhoneDto) {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-phone';
    const defaultJsonHeader: Record<string, any> = {
      'Content-Type': 'application/json',
    };
    const existPhone = await this.profileService.findOneMerchantByPhone(
      data.phone,
    );
    if (existPhone) {
      const errors: RMessage = {
        value: data.phone,
        property: 'phone',
        constraint: [this.messageService.get('merchant.general.phoneExist')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    const userData = await this.profileService.findOneById(req.user.id);
    const otpDto = new OtpDto();
    otpDto.phone = data.phone;
    otpDto.id_otp = userData.id;
    otpDto.user_type = 'merchant';
    return (
      await this.profileService.postHttp(url, otpDto, defaultJsonHeader)
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
        return response;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Post('profile/verify-phone-validation')
  @UserType('merchant')
  @AuthJwtGuard()
  async updatePhoneValidation(@Req() req: any, @Body() data: UpdatePhoneDto) {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-phone-validation';
    const defaultJsonHeader: Record<string, any> = {
      'Content-Type': 'application/json',
    };
    const existPhone = await this.profileService.findOneMerchantByPhone(
      data.phone,
    );
    if (existPhone) {
      const errors: RMessage = {
        value: data.phone,
        property: 'phone',
        constraint: [this.messageService.get('merchant.general.emailExist')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    const userData = await this.profileService.findOneById(req.user.id);
    const otpDto = new OtpDto();
    otpDto.phone = data.phone;
    otpDto.otp_code = data.otp_code;
    otpDto.id = userData.id;
    otpDto.user_type = 'merchant';
    return (
      await this.profileService.postHttp(url, otpDto, defaultJsonHeader)
    ).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.success) {
          data.id = userData.id;
          const updateResult = await this.profileService.updatePhone(data);
          const responseMerchantDataDto = new ResponseMerchantDto();
          responseMerchantDataDto.id = updateResult.id;
          responseMerchantDataDto.name = updateResult.name;
          responseMerchantDataDto.email = updateResult.email;
          responseMerchantDataDto.phone = updateResult.phone;
          responseMerchantDataDto.group_id = updateResult.group_id;
          responseMerchantDataDto.merchant_id = updateResult.merchant_id;
          responseMerchantDataDto.nip = updateResult.nip;
          responseMerchantDataDto.created_at = updateResult.created_at;
          responseMerchantDataDto.updated_at = updateResult.updated_at;
          responseMerchantDataDto.deleted_at = updateResult.deleted_at;
          responseMerchantDataDto.store = updateResult.store;
          responseMerchantDataDto.merchant = updateResult.merchant;
          responseMerchantDataDto.group = updateResult.group;
          return this.responseService.success(
            true,
            this.messageService.get('merchant.general.success'),
            responseMerchantDataDto,
          );
        }
        return response;
      }),
      catchError((err) => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            err.response.data,
            'Bad Request',
          ),
        );
      }),
    );
  }
}
