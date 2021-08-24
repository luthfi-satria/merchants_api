import {
  CanActivate,
  ExecutionContext,
  HttpService,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { map, firstValueFrom, catchError, EMPTY } from 'rxjs';
import { AuthTokenResponse } from './types';

@Injectable()
export class RoleStoreGuard implements CanActivate {
  constructor(private readonly httpService: HttpService) {}

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
            console.log('response from auth validate: ', resp);
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
      if (user_type !== 'merchant' && level !== 'store') {
        throw new UnauthorizedException(
          `user_type: ${user_type} dan level: ${level}, tidak diperbolehkan mengakses!`,
          'Unauthorized role',
        );
      }

      // pass validated token to request
      _req.user = Object.assign({}, res.data.payload);

      return true;
    } catch (e) {
      Logger.error('ERROR! Validate Auth StoreGuard: ', e.message);
      throw e;
    }
  }
}
