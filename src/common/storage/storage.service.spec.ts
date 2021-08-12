import { StorageService } from '@codebrew/nestjs-storage';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonStorageService } from './storage.service';

describe('CommonStorageService', () => {
  let service: CommonStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommonStorageService,
        {
          provide: StorageService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CommonStorageService>(CommonStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
