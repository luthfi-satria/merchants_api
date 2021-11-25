import { MenuEfoodDocument } from '../database/entities/menu_efood.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoresService } from 'src/stores/stores.service';

@Injectable()
export class MenuEfoodService {
  constructor(
    @InjectRepository(MenuEfoodDocument)
    private readonly menuEfoodRepository: Repository<MenuEfoodDocument>,
    private readonly storesService: StoresService,
  ) {}

  async natsSaveMenuEfood(data: any) {
    const store = await this.storesService.findMerchantById(data.store_id);
    const menuEfood: Partial<MenuEfoodDocument> = {
      menu_id: data.menu_price.menu.id,
      name: data.menu_price.menu.name,
      photo: data.menu_price.menu.photo,
      price: data.menu_price.price,
      store: store,
    };

    await this.menuEfoodRepository.save(menuEfood);
  }
}
