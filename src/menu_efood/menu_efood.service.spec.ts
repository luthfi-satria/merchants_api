import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MenuEfoodService } from './menu_efood.service';
import { MenuEfoodDocument } from 'src/database/entities/menu_efood.entity';
import { StoresService } from 'src/stores/stores.service';

describe('MenuEfoodService', () => {
  let service: MenuEfoodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuEfoodService,
        {
          provide: getRepositoryToken(MenuEfoodDocument),
          useValue: {},
        },
        {
          provide: StoresService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MenuEfoodService>(MenuEfoodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
