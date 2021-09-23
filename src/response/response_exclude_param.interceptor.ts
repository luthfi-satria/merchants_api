import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { delExcludeParam } from 'src/utils/general-utils';

@Injectable()
export class ResponseExcludeData implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((response) => {
        const structure = this.reflector.get<string[]>(
          'exclude_param',
          context.getHandler(),
        );
        const rsp: any = response;
        delExcludeParam(rsp.data);

        if (structure && structure.length > 0) {
          structure.forEach((element: string) => {
            const subelement = element.split('.');
            switch (subelement.length) {
              case 1:
                delExcludeParam(rsp.data[subelement[0]]);
                break;
              case 2:
                delExcludeParam(rsp.data[subelement[0]][subelement[1]]);
                break;
            }
          });
        }
        return rsp;
      }),
    );
  }
}
