import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, EMPTY, firstValueFrom, map } from 'rxjs';
import { ResponseService } from 'src/response/response.service';

/**
 * Class to handle HTTP call logic between Merchant and Auth Service
 */
@Injectable()
export class AuthInternalService {
  constructor(
    private readonly httpService: HttpService,
    private readonly responseService: ResponseService,
  ) {}

  async getMerchantUserRoleDetail(role_id: string): Promise<any> {
    try {
      const headerRequest = {
        'Content-Type': 'Application/json',
      };

      const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/roles/${role_id}`;

      return await firstValueFrom(
        this.httpService.get(url, { headers: headerRequest }).pipe(
          map((resp) => {
            const { data } = resp?.data;

            return data;
          }),
          catchError((err: any) => {
            Logger.error(err.message, '', 'GET Detail by ID');
            const { status, data } = err.response;
            const { error, message } = data; // statusCode, message, error
            const { constraint, property, value } = message[0];

            if (status == HttpStatus.BAD_REQUEST) {
              throw new BadRequestException(
                this.responseService.error(HttpStatus.BAD_REQUEST, {
                  constraint: [error],
                  property: null,
                  value: null,
                }),
                error,
              );
            } else if (status == HttpStatus.NOT_FOUND) {
              throw new NotFoundException(
                this.responseService.error(HttpStatus.NOT_FOUND, {
                  constraint: constraint,
                  property: property,
                  value: value,
                }),
                error,
              );
            }
            return EMPTY;
          }),
        ),
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'GET Admin Role Detail');
      throw e;
    }
  }

  async generateOtp(data: any): Promise<any> {
    console.info('GENERATE OTP');

    try {
      const headerRequest = {
        'Content-Type': 'Application/json',
      };

      const url: string =
        process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp/corporate';

      console.info('URL OTP ->', url);

      return await firstValueFrom(
        this.httpService
          .post(url, data, {
            headers: headerRequest,
          })
          .pipe(
            map((response) => {
              console.info(response);

              console.info(
                ![HttpStatus.OK, HttpStatus.CREATED].includes(response.status),
              );

              if (
                ![HttpStatus.OK, HttpStatus.CREATED].includes(response.status)
              ) {
                throw new BadRequestException(
                  this.responseService.error(
                    HttpStatus.BAD_REQUEST,
                    null,
                    'Bad Request',
                  ),
                );
              }

              return response;
            }),
          ),
      );
    } catch (e) {
      console.log(e);

      Logger.error(`ERROR ${e.message}`, '', 'GENERATE OTP');

      throw e;
    }
  }

  async verifyOtp(data: any): Promise<any> {
    try {
      const headerRequest = {
        'Content-Type': 'Application/json',
      };

      const url: string =
        process.env.BASEURL_AUTH_SERVICE +
        '/api/v1/auth/otp-validation/corporate';

      return await firstValueFrom(
        this.httpService.post(url, data, { headers: headerRequest }).pipe(
          map(async (response) => {
            if (
              ![HttpStatus.OK, HttpStatus.CREATED].includes(response.status)
            ) {
              throw new BadRequestException(
                this.responseService.error(
                  HttpStatus.BAD_REQUEST,
                  null,
                  'Bad Request',
                ),
              );
            }
            return response;
          }),
          catchError((err) => {
            throw err.response.data;
          }),
        ),
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'VERIFY OTP');

      throw e;
    }
  }
}
