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
    console.log('natsCreateStoreAvailability:\n', data);
    if (data.menu_price.menu_sales_channel.platform == 'ONLINE') {
      try {
        const menuOnlines = await this.menuOnlineRepository.find({
          where: {
            store_id: data.store_id,
            menu_id: data.menu_price.menu_menu.id,
            // menu_price_id: data.menu_price.id,
          },
        });
        const menuOnlineData: Partial<MenuOnlineDocument> = {
          menu_price_id: data.menu_price.id,
          menu_id: data.menu_price.menu_menu.id,
          name: data.menu_price.menu_menu.name,
          photo: data.menu_price.menu_menu.photo,
          price: data.menu_price.price,
          store_id: data.store_id,
        };
        menuOnlineData.discounted_price = data.discounted_price
          ? data.discounted_price
          : null;
        if (data.id) menuOnlineData.menu_store_id = data.id;

        if (menuOnlines.length > 0) {
          if (menuOnlines.length == 1) {
            const menuOnline = menuOnlines[0];
            menuOnline.name = data.menu_price.menu_menu.name;
            menuOnline.photo = data.menu_price.menu_menu.photo;
            menuOnline.price = data.menu_price.price;
            menuOnline.menu_store_id = data.id;
            menuOnline.updated_at = new Date();

            await this.menuOnlineRepository.update(menuOnline.id, menuOnline);
          } else if (menuOnlines.length > 1) {
            for (const menu_online of menuOnlines) {
              if (menu_online.discounted_price) {
                menuOnlineData.discounted_price = menu_online.discounted_price;
              }
              await this.menuOnlineRepository.softDelete(menu_online.id);
            }
            await this.menuOnlineRepository.save(menuOnlineData);
          }
        } else {
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
    console.log('natsUpdateStoreAvailabilityy:\n', data);
    if (data.menu_price.menu_sales_channel.platform == 'ONLINE') {
      try {
        //Check By Menu
        const menuOnlines = await this.menuOnlineRepository.find({
          store_id: data.store_id,
          menu_id: data.menu_price.menu_menu.id,
        });

        if (menuOnlines.length < 0) {
          await this.natsCreateStoreAvailability(data);
        } else if (menuOnlines.length == 1) {
          menuOnlines[0].store_id = data.store_id;
          menuOnlines[0].menu_price_id = data.menu_price.id;
          menuOnlines[0].menu_id = data.menu_price.menu_menu.id;
          menuOnlines[0].name = data.menu_price.menu_menu.name;
          menuOnlines[0].photo = data.menu_price.menu_menu.photo;
          menuOnlines[0].price = data.menu_price.price;
          menuOnlines[0].updated_at = new Date();

          await this.menuOnlineRepository.update(
            menuOnlines[0].id,
            menuOnlines[0],
          );
        } else if (menuOnlines.length > 1) {
          for (const menu_online of menuOnlines) {
            if (menu_online.discounted_price) {
              data.discounted_price = menu_online.discounted_price;
            }
            await this.menuOnlineRepository.softDelete(menu_online.id);
          }
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

  async getMenuOnlineBufferS3(data: any) {
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
