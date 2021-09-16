import { BadRequestException, Body, Controller, HttpStatus, Post, Req } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ProfileService } from './profile.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { OtpDto, UpdateEmailDto, UpdatePhoneDto } from './validation/profile.validation';
import { RMessage } from 'src/response/response.interface';
import { catchError, map } from 'rxjs';

@Controller('api/v1/merchants/profile')
export class ProfileController {
    constructor(
        private readonly profileService: ProfileService,
        @Response() private readonly responseService: ResponseService,
        @Message() private readonly messageService: MessageService, // private httpService: HttpService,
    ) {}

    @Post('verify-email')
    @UserType('merchant')
    @AuthJwtGuard()
    async updateEmail(@Req() req: any,@Body() data: UpdateEmailDto){
        const url: string = process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-email';
        const defaultJsonHeader: Record<string, any> = {
        'Content-Type': 'application/json',
        };
        const existEmail = await this.profileService.findOneMerchantByEmail(data.email)
        if(existEmail){
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
        const userData = await this.profileService.findOneById(req.user.id)
        const otpDto = new OtpDto()
        otpDto.email = data.email
        otpDto.id_otp = userData.id
        otpDto.user_type = 'merchant'
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

    @Post('verify-email-validation')
    @UserType('merchant')
    @AuthJwtGuard()
    async updateEmailValidation(@Req() req: any,@Body() data: UpdateEmailDto){
        const url: string = process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-email-validation';
        const defaultJsonHeader: Record<string, any> = {
        'Content-Type': 'application/json',
        };
        const existEmail = await this.profileService.findOneMerchantByEmail(data.email)
        if(existEmail){
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
        const userData = await this.profileService.findOneById(req.user.id)
        const otpDto = new OtpDto()
        otpDto.email = data.email
        otpDto.otp_code = data.otp_code
        otpDto.id = userData.id
        otpDto.user_type = 'merchant'
        return (
        await this.profileService.postHttp(url, otpDto, defaultJsonHeader)
        ).pipe(
        map(async (response) => {
            const rsp: Record<string, any> = response;

            if (rsp.success) {
            data.id = userData.id
            const updateResult = await this.profileService.updateEmail(data)
            return this.responseService.success(
                true,
                this.messageService.get('merchant.general.success'),
                updateResult,
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

    @Post('verify-phone')
    @UserType('merchant')
    @AuthJwtGuard()
    async updatePhone(@Req() req: any,@Body() data: UpdatePhoneDto){
        const url: string = process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-phone';
        const defaultJsonHeader: Record<string, any> = {
        'Content-Type': 'application/json',
        };
        const existPhone = await this.profileService.findOneMerchantByPhone(data.phone)
        if(existPhone){
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
        const userData = await this.profileService.findOneById(req.user.id)
        const otpDto = new OtpDto()
        otpDto.phone = data.phone
        otpDto.id_otp = userData.id
        otpDto.user_type = 'merchant'
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

    @Post('verify-phone-validation')
    @UserType('merchant')
    @AuthJwtGuard()
    async updatePhoneValidation(@Req() req: any,@Body() data: UpdatePhoneDto){
        const url: string = process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-phone-validation';
        const defaultJsonHeader: Record<string, any> = {
        'Content-Type': 'application/json',
        };
        const existPhone = await this.profileService.findOneMerchantByPhone(data.phone)
        if(existPhone){
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
        const userData = await this.profileService.findOneById(req.user.id)
        const otpDto = new OtpDto()
        otpDto.phone = data.phone
        otpDto.otp_code = data.otp_code
        otpDto.id = userData.id
        otpDto.user_type = 'merchant'
        return (
        await this.profileService.postHttp(url, otpDto, defaultJsonHeader)
        ).pipe(
        map(async (response) => {
            const rsp: Record<string, any> = response;

            if (rsp.success) {
            data.id = userData.id
            const updateResult = await this.profileService.updatePhone(data)
            return this.responseService.success(
                true,
                this.messageService.get('merchant.general.success'),
                updateResult,
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
