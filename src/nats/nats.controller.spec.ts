import { Test, TestingModule } from '@nestjs/testing';
import { StoresService } from 'src/stores/stores.service';
import { NatsController } from './nats.controller';

describe('NatsController', () => {
  let controller: NatsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: StoresService,
          useValue: {},
        },
      ],
      controllers: [NatsController],
    }).compile();

    controller = module.get<NatsController>(NatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
