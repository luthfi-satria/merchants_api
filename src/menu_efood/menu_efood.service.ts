import { MenuEfoodDocument } from './../database/entities/menu_efood.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MenuEfoodService {
  constructor(
    @InjectRepository(MenuEfoodDocument)
    private readonly menuEfoodRepository: Repository<MenuEfoodDocument>,
  ) {}

  async updateMenuEfood(menuEfood) {
    console.log('UPDATE MENU EFOOD');
    try {
      const menu = await this.menuEfoodRepository.save(menuEfood);
      console.log(menu);
    } catch (error) {
      console.log(error);
    }
  }
}
