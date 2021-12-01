import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MenuOnlineService } from './menu_online.service';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import { StoresService } from 'src/stores/stores.service';

describe('MenuOnlineService', () => {
  let service: MenuOnlineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuOnlineService,
        {
          provide: getRepositoryToken(MenuOnlineDocument),
          useValue: {},
        },
        {
          provide: StoresService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MenuOnlineService>(MenuOnlineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
