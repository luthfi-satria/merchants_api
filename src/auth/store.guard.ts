import {
  CanActivate,
  ExecutionContext,
  HttpService,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { map, firstValueFrom, catchError } from 'rxjs';
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

      const res = await firstValueFrom<AuthTokenResponse>(
        this.httpService
          .get(`http://localhost:4003/api/v1/auth/validate-token`, {
            headers: headerRequest,
          })
          .pipe(
            map((resp) => {
              return resp?.data;
            }),
            catchError((err) => {
              Logger.error(err.message, '', 'Auth Token Validate');
              throw err;
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
      Logger.error('Validate Auth Failed: ', e.message);
      throw e;
    }
  }
}
