import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import etag from 'etag';
import { MenuOnlineService } from './menu_online.service';

@Controller('api/v1/merchants/menu-onlines')
export class MenuOnlineController {
  constructor(private readonly menuOnlineService: MenuOnlineService) {}

  @Get(':id/image')
  async streamFile(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const data = { id };
    let images = null;

    try {
      images = await this.menuOnlineService.getGroupBufferS3(data);
    } catch (error) {
      console.error(error);
      throw error;
    }

    const tag = etag(images.buffer);
    if (req.headers['if-none-match'] && req.headers['if-none-match'] === tag) {
      throw new HttpException('Not Modified', HttpStatus.NOT_MODIFIED);
    }

    res.set({
      'Content-Type': images.type + '/' + images.ext,
      'Content-Length': images.buffer.length,
      ETag: tag,
    });

    images.stream.pipe(res);
  }
}
