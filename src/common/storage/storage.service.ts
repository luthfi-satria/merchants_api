import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { StorageService as NestStorageService } from '@codebrew/nestjs-storage';
import { AmazonWebServicesS3Storage } from '@slynova/flydrive-s3';
import fs from 'fs';
import { createUrl } from '../../utils/general-utils';
import { Readable } from 'stream';

@Injectable()
export class CommonStorageService {
  constructor(private readonly storage: NestStorageService) {}

  async store(fileName: string): Promise<string> {
    if (process.env.STORAGE_DRIVER === 'local') {
      return createUrl(fileName);
    }

    const file = fileName.replace(/^\//, '');

    if (process.env.STORAGE_DRIVER === 's3') {
      try {
        this.storage.registerDriver('s3', AmazonWebServicesS3Storage);
        await this.storage
          .getDisk('s3')
          .put(file, fs.readFileSync(`./${file}`));

        const url = this.storage.getDisk('s3').getUrl(file);

        return url;
      } catch (e) {
        console.error(e);
        throw new InternalServerErrorException(e.message);
      }
    }
  }

  async getBuff(url: string) {
    const testUrl = url.includes(process.env.STORAGE_S3_BUCKET);
    if (process.env.STORAGE_DRIVER === 's3' && testUrl) {
      try {
        this.storage.registerDriver('s3', AmazonWebServicesS3Storage);
        url = url.split(process.env.STORAGE_S3_BUCKET)[1].substring(1);

        const buff = (await this.storage.getDisk('s3').getBuffer(url)).content;

        return buff;
      } catch (e) {
        console.error(e);
        throw new InternalServerErrorException(e.message);
      }
    }
    return url;
  }

  async getImageProperties(url: string): Promise<any> {
    const buffer = await this.getBuff(url);

    if (buffer) {
      // async getReadableStream(buffer: Buffer) {
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      let type = null;
      const ext = url.split('.')[url.split('.').length - 1].toLowerCase();
      if (ext == 'png' || ext == 'jpg' || ext == 'jpeg' || ext == 'gif') {
        type = 'image';
      }

      return {
        buffer: buffer,
        stream: stream,
        type: type,
        ext: ext,
      };
    }
    // return images;
  }
}
