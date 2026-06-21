import { CanActivate } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Feedback } from '@prisma/client';
import { Request } from 'express';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { EXAMPLE_UUID } from '../../../common/constants/uuid.example';
import { FeedbacksController } from '../feedbacks.controller';
import { FeedbacksService } from '../feedbacks.service';

const alwaysAllow: CanActivate = { canActivate: () => true };

const BASE_FEEDBACK: Feedback = {
  id: EXAMPLE_UUID,
  name: 'Juliana Paes',
  company: 'Bloom',
  comment: 'Profissional incrível.',
  jobTitle: 'Fundadora da Bloom',
  avatar: null,
  createdAt: new Date('2026-01-01'),
};

const feedbacksServiceMock = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

function mockReq(body: Record<string, unknown> = {}): Request {
  return { body } as Request;
}

describe('FeedbacksController', () => {
  let controller: FeedbacksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbacksController],
      providers: [
        { provide: FeedbacksService, useValue: feedbacksServiceMock },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue(alwaysAllow)
      .overrideGuard(ThrottlerGuard)
      .useValue(alwaysAllow)
      .compile();

    controller = module.get<FeedbacksController>(FeedbacksController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('delegates to service', async () => {
      feedbacksServiceMock.findAll.mockResolvedValue([BASE_FEEDBACK]);
      const result = await controller.findAll();
      expect(result).toEqual([BASE_FEEDBACK]);
      expect(feedbacksServiceMock.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('merges jobTitle from raw multipart body into payload', async () => {
      feedbacksServiceMock.create.mockResolvedValue(BASE_FEEDBACK);
      const body = { name: 'Juliana Paes' };
      const req = mockReq({ name: 'Juliana Paes', jobTitle: 'CEO' });

      await controller.create(undefined, req, body as never);

      expect(feedbacksServiceMock.create).toHaveBeenCalledWith(undefined, {
        name: 'Juliana Paes',
        jobTitle: 'CEO',
      });
    });
  });

  describe('update', () => {
    it('merges jobTitle from raw multipart body when DTO misses it', async () => {
      feedbacksServiceMock.update.mockResolvedValue(BASE_FEEDBACK);
      const req = mockReq({ jobTitle: 'Teste' });

      await controller.update(EXAMPLE_UUID, undefined, req, {} as never);

      expect(feedbacksServiceMock.update).toHaveBeenCalledWith(
        EXAMPLE_UUID,
        undefined,
        expect.objectContaining({ jobTitle: 'Teste' }),
      );
    });
  });

  describe('remove', () => {
    it('delegates to service with uuid id', async () => {
      feedbacksServiceMock.remove.mockResolvedValue(undefined);
      await controller.remove(EXAMPLE_UUID);
      expect(feedbacksServiceMock.remove).toHaveBeenCalledWith(EXAMPLE_UUID);
    });
  });
});
