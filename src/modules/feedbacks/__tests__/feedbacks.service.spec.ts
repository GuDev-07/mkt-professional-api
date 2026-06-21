import { Test, TestingModule } from '@nestjs/testing';
import { Feedback } from '@prisma/client';
import { EXAMPLE_UUID } from '../../../common/constants/uuid.example';
import { S3StorageService } from '../../uploads/s3-storage.service';
import { FeedbacksService } from '../feedbacks.service';
import { CreateFeedbackUseCase } from '../use-cases/create-feedback.usecase';
import { DeleteFeedbackUseCase } from '../use-cases/delete-feedback.usecase';
import { ListFeedbacksUseCase } from '../use-cases/list-feedbacks.usecase';
import { UpdateFeedbackUseCase } from '../use-cases/update-feedback.usecase';

const BASE_FEEDBACK: Feedback = {
  id: EXAMPLE_UUID,
  name: 'Juliana Paes',
  company: 'Bloom',
  comment: 'Profissional incrível.',
  jobTitle: 'Fundadora da Bloom',
  avatar: null,
  createdAt: new Date('2026-01-01'),
};

const listMock = { execute: jest.fn() };
const createMock = { execute: jest.fn() };
const updateMock = { execute: jest.fn() };
const deleteMock = { execute: jest.fn() };
const s3Mock = { getPresignedDownloadUrl: jest.fn() };

describe('FeedbacksService', () => {
  let service: FeedbacksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbacksService,
        { provide: ListFeedbacksUseCase, useValue: listMock },
        { provide: CreateFeedbackUseCase, useValue: createMock },
        { provide: UpdateFeedbackUseCase, useValue: updateMock },
        { provide: DeleteFeedbackUseCase, useValue: deleteMock },
        { provide: S3StorageService, useValue: s3Mock },
      ],
    }).compile();

    service = module.get<FeedbacksService>(FeedbacksService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns feedbacks with null avatar unchanged', async () => {
      listMock.execute.mockResolvedValue([BASE_FEEDBACK]);
      const result = await service.findAll();
      expect(result[0].avatar).toBeNull();
    });

    it('passes through external avatar URL without proxying', async () => {
      const feedback = {
        ...BASE_FEEDBACK,
        avatar: 'https://cdn.example.com/photo.jpg',
      };
      listMock.execute.mockResolvedValue([feedback]);
      const result = await service.findAll();
      expect(result[0].avatar).toBe('https://cdn.example.com/photo.jpg');
    });

    it('resolves S3 key to proxy URL when MEDIA_DIRECT_PRESIGN is not set', async () => {
      delete process.env.MEDIA_DIRECT_PRESIGN;
      const feedback = { ...BASE_FEEDBACK, avatar: 'feedbacks/123_uuid.jpg' };
      listMock.execute.mockResolvedValue([feedback]);
      const result = await service.findAll();
      expect(result[0].avatar).toContain('/media/');
    });
  });

  describe('create', () => {
    it('delegates to CreateFeedbackUseCase and maps result', async () => {
      const stored = { ...BASE_FEEDBACK, avatar: 'feedbacks/abc.jpg' };
      createMock.execute.mockResolvedValue(stored);
      const result = await service.create(undefined, { name: 'Juliana Paes' });
      expect(createMock.execute).toHaveBeenCalledWith(undefined, {
        name: 'Juliana Paes',
      });
      expect(result.avatar).toContain('/media/');
    });
  });

  describe('update', () => {
    it('delegates to UpdateFeedbackUseCase and maps result', async () => {
      updateMock.execute.mockResolvedValue(BASE_FEEDBACK);
      await service.update(EXAMPLE_UUID, undefined, { comment: 'Novo' });
      expect(updateMock.execute).toHaveBeenCalledWith(EXAMPLE_UUID, undefined, {
        comment: 'Novo',
      });
    });
  });

  describe('remove', () => {
    it('delegates to DeleteFeedbackUseCase', async () => {
      deleteMock.execute.mockResolvedValue(undefined);
      await service.remove(EXAMPLE_UUID);
      expect(deleteMock.execute).toHaveBeenCalledWith(EXAMPLE_UUID);
    });
  });
});
