import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ResponseService } from '../response/response.service';

@Injectable()
export class ValidationMiddleware implements NestMiddleware {
  constructor(private readonly responseService: ResponseService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const condition =
      this.undefinedPathValidation(req) || this.nullPathValidation(req);

    const message = this.undefinedPathValidation(req)
      ? 'Contain undefined value on path.'
      : 'Contain null value on path.';

    if (condition) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: null,
            property: null,
            constraint: [message],
          },
          'Bad Request',
        ),
      );
    }

    next();
  }

  undefinedPathValidation(req: Request) {
    const lowerCaseUrl = req.path.toLowerCase();

    return lowerCaseUrl.includes('undefined');
  }

  nullPathValidation(req: Request) {
    const lowerCaseUrl = req.path.toLowerCase();

    return lowerCaseUrl.includes('null');
  }
}
