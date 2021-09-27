import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import languages from './message.constant';

@Injectable()
export class MessageService {
  private readonly languages: Record<string, any> = languages;

  constructor(private readonly configService: ConfigService) {}

  get(key: string): string {
    // Env Variable
    const defaultMessage = process.env.APP_LANGUAGE;
    const keys: string[] = key.split('.');
    let selectedMessage: Record<string, any> | string =
      this.languages[defaultMessage];

    for (const i of keys) {
      selectedMessage = selectedMessage[i];

      if (!selectedMessage) {
        selectedMessage = key;
        break;
      }
    }

    return selectedMessage as string;
  }

  getjson(data: Record<string, any> | string): string {
    return data as string;
  }

  getRequestErrorsMessage(requestErrors: Record<string, any>[]): string {
    const messageErrors: string[] = requestErrors.map((value) => {
      for (const i in value.constraints) {
        return value.property[0];
      }
    });
    return messageErrors[0];
  }

  getLang(key: string): string {
    // Env Variable
    const keys: string[] = key.split('.');
    // const defaultMessage = keys[0];
    let selectedMessage: Record<string, any> | string = this.languages;

    for (const i of keys) {
      selectedMessage = selectedMessage[i];

      if (!selectedMessage) {
        selectedMessage = key;
        break;
      }
    }

    return selectedMessage as string;
  }
}
