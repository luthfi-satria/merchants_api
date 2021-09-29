import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { catchError, firstValueFrom, map } from 'rxjs';

@Injectable()
export class MailerService {
  constructor(private readonly httpService: HttpService) {}

  logger = new Logger();

  async sendEmail(): Promise<void> {
    const url = `${process.env.BASEURL_NOTIFICATIONS_SERVICE}/api/v1/email`;
    this.logger.log(url);
    try {
      firstValueFrom(
        this.httpService
          .post(url, {})
          .pipe(map((response: any) => response.data)),
      );
    } catch (err) {
      console.error(err);
    }
  }
}
