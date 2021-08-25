import { HttpStatus } from '@nestjs/common';
import {
  CanActivate,
  ExecutionContext,
  HttpService,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { map, firstValueFrom, catchError, EMPTY } from 'rxjs';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { AuthTokenResponse } from './types';

@Injectable()
export class RoleStoreGuard implements CanActivate {
  constructor(
    private readonly httpService: HttpService,
    private readonly responseService: ResponseService,
  ) {}

  private roleAuthError(value: any, property: any, errorMessage: string) {
    const errors: RMessage = {
      value: value,
      property: property,
      constraint: [errorMessage],
    };
    return this.responseService.error(
      HttpStatus.UNAUTHORIZED,
      errors,
      'Role Unauthorize',
    );
  }

  async canActivate(_context: ExecutionContext) {
    const _req = _context.switchToHttp().getRequest();
    if (_req.headers && _req.headers.authorization == undefined)
      throw new UnauthorizedException('Missing authorization header');

    const token = _req.headers.authorization;

    try {
      const headerRequest = {
        'Content-Type': 'application/json',
        Authorization: token,
      };
      const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/validate-token`;

      const res = await firstValueFrom<AuthTokenResponse>(
        this.httpService.get(url, { headers: headerRequest }).pipe(
          map((resp) => {
            return resp?.data;
          }),
          catchError((err: any) => {
            Logger.error(err.message, '', 'RoleStoreGuard');

            const { status, statusText } = err.response;

            if (status == 401) {
              throw new UnauthorizedException(
                'Invalid Auth Token validation from Auth Service, please refresh your token!',
                'Auth Token Validation Error',
              );
            }
            return EMPTY;
          }),
        ),
      );

      const { user_type, level } = res?.data?.payload;
      if (user_type !== 'merchant')
        throw new UnauthorizedException(
          this.roleAuthError(
            user_type,
            'user_type',
            `Unauthorized auth token user_type`,
          ),
        );

      if (user_type == 'merchant' && level !== 'store') {
        throw new UnauthorizedException(
          this.roleAuthError(
            level,
            'level',
            `Unauthorized merchant's role level`,
          ),
        );
      }

      // pass validated token to controller
      _req.user = Object.assign({}, res.data.payload);

      return true;
    } catch (e) {
      Logger.error('ERROR! Validate Auth StoreGuard: ', e.message);
      throw e;
    }
  }
}
