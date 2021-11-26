import { Test, TestingModule } from '@nestjs/testing';
import { MenuEfoodController } from './menu_efood.controller';

describe('MenuEfoodController', () => {
  let controller: MenuEfoodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuEfoodController],
    }).compile();

    controller = module.get<MenuEfoodController>(MenuEfoodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
