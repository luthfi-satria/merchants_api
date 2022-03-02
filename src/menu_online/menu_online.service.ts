import { MenuOnlineDocument } from '../database/entities/menu_online.entity';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RMessage } from 'src/response/response.interface';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CommonStorageService } from 'src/common/storage/storage.service';

@Injectable()
export class MenuOnlineService {
  constructor(
    @InjectRepository(MenuOnlineDocument)
    private readonly menuOnlineRepository: Repository<MenuOnlineDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly storage: CommonStorageService,
  ) {}

  async natsCreateStoreAvailability(data: any) {
    if (data.menu_price.menu_sales_channel.platform == 'ONLINE') {
      try {
        const menuOnline = await this.menuOnlineRepository.findOne({
          where: {
            store_id: data.store_id,
            menu_id: data.menu_price.menu_menu.id,
            menu_price_id: data.menu_price.id,
          },
        });
        if (menuOnline) {
          menuOnline.name = data.menu_price.menu_menu.name;
          menuOnline.photo = data.menu_price.menu_menu.photo;
          menuOnline.price = data.menu_price.price;
          menuOnline.menu_store_id = data.id;
          menuOnline.updated_at = new Date();

          await this.menuOnlineRepository.update(menuOnline.id, menuOnline);
        } else {
          const menuOnlineData: Partial<MenuOnlineDocument> = {
            menu_store_id: data.id,
            menu_price_id: data.menu_price.id,
            menu_id: data.menu_price.menu_menu.id,
            name: data.menu_price.menu_menu.name,
            photo: data.menu_price.menu_menu.photo,
            price: data.menu_price.price,
            store_id: data.store_id,
          };

          await this.menuOnlineRepository.save(menuOnlineData);
        }
      } catch (e) {
        const logger = new Logger();
        logger.log(e, 'Catch Error :  ');
        throw e;
      }
    }
  }

  async natsUpdateStoreAvailabilityy(data: any) {
    if (data.menu_price.menu_sales_channel.platform == 'ONLINE') {
      try {
        const menuOnline = await this.menuOnlineRepository.findOne({
          menu_store_id: data.id,
        });

        if (menuOnline) {
          menuOnline.store_id = data.store_id;
          menuOnline.menu_price_id = data.menu_price.id;
          menuOnline.menu_id = data.menu_price.menu_menu.id;
          menuOnline.name = data.menu_price.menu_menu.name;
          menuOnline.photo = data.menu_price.menu_menu.photo;
          menuOnline.price = data.menu_price.price;
          menuOnline.updated_at = new Date();

          await this.menuOnlineRepository.update(menuOnline.id, menuOnline);
        } else {
          await this.natsCreateStoreAvailability(data);
        }
      } catch (e) {
        const logger = new Logger();
        logger.log(e, 'Catch Error :  ');
        throw e;
      }
    }
  }

  async natsdeleteStoreAvailability(data: any) {
    await this.menuOnlineRepository.softDelete({
      menu_store_id: data.id,
    });
  }

  async natsUpdateMenuOnline(data: any) {
    const menus = await this.menuOnlineRepository.find({ menu_id: data.id });
    for (const menu of menus) {
      const menuData = {
        id: menu.id,
        name: data.name ? data.name : menu.name,
        photo: data.photo ? data.photo : menu.photo,
      };

      await this.menuOnlineRepository.save(menuData);
    }
  }

  async natsDeleteMenuOnline(data: any) {
    await this.menuOnlineRepository.softDelete({
      menu_id: data.id,
    });
  }

  async natsUpdateMenuPrice(data: any) {
    if (data.menu_sales_channel.platform == 'ONLINE') {
      const menuOnlines = await this.menuOnlineRepository.find({
        menu_price_id: data.id,
      });

      if (menuOnlines.length > 0) {
        for (const menuOnline of menuOnlines) {
          menuOnline.menu_id = data.menu_menu.id;
          menuOnline.name = data.menu_menu.name;
          menuOnline.photo = data.menu_menu.photo;
          menuOnline.price = data.price;
          menuOnline.updated_at = new Date();
          await this.menuOnlineRepository.update(menuOnline.id, menuOnline);
        }
      }
    }
  }

  async natsDeleteMenuPrice(data: any) {
    this.menuOnlineRepository.softDelete({
      menu_price_id: data.id,
    });
  }

  async updateMenuPriceByCriteria(
    criteria: Partial<MenuOnlineDocument>,
    data: Partial<MenuOnlineDocument>,
  ) {
    await this.menuOnlineRepository.update(criteria, data);
  }

  async getGroupBufferS3(data: any) {
    try {
      const menuOnline = await this.menuOnlineRepository.findOne({
        id: data.id,
      });

      if (!menuOnline) {
        const errors: RMessage = {
          value: data.id,
          property: 'id',
          constraint: [
            this.messageService.get('merchant.general.dataNotFound'),
          ],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      }
      return await this.storage.getImageProperties(menuOnline.photo);
    } catch (error) {
      console.error(error);
    }
  }
}
