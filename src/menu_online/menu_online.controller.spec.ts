import { Test, TestingModule } from '@nestjs/testing';
import { MenuOnlineController } from './menu_online.controller';

describe('MenuOnlineController', () => {
  let controller: MenuOnlineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuOnlineController],
    }).compile();

    controller = module.get<MenuOnlineController>(MenuOnlineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
