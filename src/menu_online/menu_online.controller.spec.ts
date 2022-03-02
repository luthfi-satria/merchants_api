import { Test, TestingModule } from '@nestjs/testing';
import { MenuOnlineController } from './menu_online.controller';
import { MenuOnlineService } from './menu_online.service';

describe('MenuOnlineController', () => {
  let controller: MenuOnlineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuOnlineController],
      providers: [
        {
          provide: MenuOnlineService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<MenuOnlineController>(MenuOnlineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
