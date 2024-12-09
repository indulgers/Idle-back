import { Test, TestingModule } from '@nestjs/testing';
import { DonateController } from './donate.controller';
import { DonateService } from './donate.service';

describe('DonateController', () => {
  let donateController: DonateController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DonateController],
      providers: [DonateService],
    }).compile();

    donateController = app.get<DonateController>(DonateController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(donateController.getHello()).toBe('Hello World!');
    });
  });
});
