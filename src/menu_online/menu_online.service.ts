import { MenuOnlineDocument } from '../database/entities/menu_online.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoresService } from 'src/stores/stores.service';

@Injectable()
export class MenuOnlineService {
  constructor(
    @InjectRepository(MenuOnlineDocument)
    private readonly menuOnlineRepository: Repository<MenuOnlineDocument>,
    private readonly storesService: StoresService,
  ) {}

  async natsCreateStoreAvailability(data: any) {
    if (data.menu_price.menu_sales_channel.platform == 'ONLINE') {
      const store = await this.storesService.findStoreById(data.store_id);

      const menuOnline: Partial<MenuOnlineDocument> = {
        menu_store_id: data.id,
        menu_price_id: data.menu_price.id,
        menu_id: data.menu_price.menu_menu.id,
        name: data.menu_price.menu_menu.name,
        photo: data.menu_price.menu_menu.photo,
        price: data.menu_price.price,
        store: store,
      };
      const objMenuOnline = Object.assign({}, menuOnline);
      await this.menuOnlineRepository.save(objMenuOnline);
    }
  }

  async natsUpdateStoreAvailabilityy(data: any) {
    if (data.menu_price.menu_sales_channel.platform == 'ONLINE') {
      const menuOnline = await this.menuOnlineRepository.findOne({
        menu_store_id: data.id,
      });
      const store = await this.storesService.findStoreById(data.store_id);

      if (menuOnline && store) {
        menuOnline.store = store;
        menuOnline.menu_price_id = data.menu_price.id;
        menuOnline.menu_id = data.menu_price.menu_menu.id;
        menuOnline.name = data.menu_price.menu_menu.name;
        menuOnline.photo = data.menu_price.menu_menu.photo;
        menuOnline.price = data.menu_price.price;

        const objMenuOnline = Object.assign({}, menuOnline);
        await this.menuOnlineRepository.save(objMenuOnline);
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
      const objMenuOnline = Object.assign({}, menu);
      this.menuOnlineRepository.save(objMenuOnline);
    }
  }

  async natsDeleteMenuOnline(data: any) {
    this.menuOnlineRepository.softDelete({ menu_id: data.id });
  }

  async natsUpdateMenuPrice(data: any) {
    if (data.menu_sales_channel.platform == 'ONLINE') {
      const menuOnlines = await this.menuOnlineRepository.find({
        menu_price_id: data.id,
      });

      if (menuOnlines.length > 0) {
        for (const menuOnline of menuOnlines) {
          const store = await this.storesService.findStoreById(data.store_id);
          if (store) {
            menuOnline.menu_id = data.menu_menu.id;
            menuOnline.name = data.menu_menu.name;
            menuOnline.photo = data.menu_menu.photo;
            menuOnline.price = data.price;
            menuOnline.store = store;

            const objMenuOnline = Object.assign({}, menuOnline);
            this.menuOnlineRepository.save(objMenuOnline);
          }
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
