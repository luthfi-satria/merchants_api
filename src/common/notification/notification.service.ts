import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';

@Injectable()
export class NotificationService {
  constructor(private readonly httpService: HttpService) {}

  logger = new Logger();

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html = '',
  ): Promise<void> {
    const url = `${process.env.BASEURL_NOTIFICATIONS_SERVICE}/api/v1/email`;

    try {
      await firstValueFrom(
        this.httpService
          .post(url, { to, subject, text, html })
          .pipe(map((response: any) => response.data)),
      );
    } catch (err) {
      console.error(err.response.data);
    }
  }

  async sendSms(to: string, message: string): Promise<void> {
    const url = `${process.env.BASEURL_NOTIFICATIONS_SERVICE}/api/v1/sms`;

    try {
      await firstValueFrom(
        this.httpService
          .post(url, { to, message })
          .pipe(map((response: any) => response.data)),
      );
    } catch (err) {
      console.error(err.response.data);
    }
  }
}
