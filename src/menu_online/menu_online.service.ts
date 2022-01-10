import { MenuOnlineDocument } from '../database/entities/menu_online.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoresService } from 'src/stores/stores.service';
import { listeners } from 'process';

@Injectable()
export class MenuOnlineService {
  constructor(
    @InjectRepository(MenuOnlineDocument)
    private readonly menuOnlineRepository: Repository<MenuOnlineDocument>,
    private readonly storesService: StoresService,
  ) {}

  async natsCreateStoreAvailability(data: any) {
    if (data.menu_price.menu_sales_channel.platform == 'ONLINE') {
      await this.storesService.findMerchantStoreById(data.store_id);

      const menuOnline: Partial<MenuOnlineDocument> = {
        menu_store_id: data.id,
        menu_price_id: data.menu_price.id,
        menu_id: data.menu_price.menu_menu.id,
        name: data.menu_price.menu_menu.name,
        photo: data.menu_price.menu_menu.photo,
        price: data.menu_price.price,
        store_id: data.store_id,
      };

      await this.menuOnlineRepository.save(menuOnline, { listeners: false });
    }
  }

  async natsUpdateStoreAvailabilityy(data: any) {
    if (data.menu_price.menu_sales_channel.platform == 'ONLINE') {
      const menuOnline = await this.menuOnlineRepository.findOne({
        menu_store_id: data.id,
      });
      const store = await this.storesService.findMerchantStoreById(
        data.store_id,
      );

      if (menuOnline && store) {
        menuOnline.store_id = data.store_id;
        menuOnline.menu_price_id = data.menu_price.id;
        menuOnline.menu_id = data.menu_price.menu_menu.id;
        menuOnline.name = data.menu_price.menu_menu.name;
        menuOnline.photo = data.menu_price.menu_menu.photo;
        menuOnline.price = data.menu_price.price;

        await this.menuOnlineRepository.update(menuOnline.id, menuOnline);
      } else {
        await this.natsCreateStoreAvailability(data);
      }
    }
  }

  async natsdeleteStoreAvailability(data: any) {
    this.menuOnlineRepository.softDelete({
      menu_store_id: data.id,
    });
  }

  async natsUpdateMenuOnline(data: any) {
    const menus = await this.menuOnlineRepository.find({ menu_id: data.id });
    for (const menu of menus) {
      menu.name = data.name ? data.name : menu.name;
      menu.photo = data.photo ? data.photo : menu.photo;
      this.menuOnlineRepository.save(menu);
    }
  }

  async natsDeleteMenuOnline(data: any) {
    this.menuOnlineRepository.softDelete({ menu_id: data.id });
  }

  async natsUpdateMenuPrice(data: any) {
    console.log('data', data);
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
}
