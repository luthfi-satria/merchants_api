import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { delParamNoActiveUpdate } from 'src/utils/general-utils';

@Injectable()
export class ExcludeResponseMerchant implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((response) => {
        delParamNoActiveUpdate(response.data);
        if (typeof response.data.group)
          delParamNoActiveUpdate(response.data.group);
        return response;
      }),
    );
  }
}
