import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Feedback } from '@prisma/client';
import { EXAMPLE_UUID, OTHER_UUID } from '../../../common/constants/uuid.example';
import { PrismaService } from '../../../prisma/prisma.service';
import { S3StorageService } from '../../uploads/s3-storage.service';
import { DeleteFeedbackUseCase } from '../use-cases/delete-feedback.usecase';

const prismaMock = {
  feedback: {
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
};

const s3Mock = {
  deleteObject: jest.fn(),
};

describe('DeleteFeedbackUseCase', () => {
  let useCase: DeleteFeedbackUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteFeedbackUseCase,
        { provide: PrismaService, useValue: prismaMock },
        { provide: S3StorageService, useValue: s3Mock },
      ],
    }).compile();

    useCase = module.get<DeleteFeedbackUseCase>(DeleteFeedbackUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('throws NotFoundException when feedback does not exist', async () => {
    prismaMock.feedback.findUnique.mockResolvedValue(null);
    await expect(useCase.execute(OTHER_UUID)).rejects.toThrow(NotFoundException);
    expect(prismaMock.feedback.delete).not.toHaveBeenCalled();
    expect(s3Mock.deleteObject).not.toHaveBeenCalled();
  });

  it('deletes DB record and skips storage when avatar is null', async () => {
    prismaMock.feedback.findUnique.mockResolvedValue({ avatar: null });
    prismaMock.feedback.delete.mockResolvedValue(undefined);

    await useCase.execute(EXAMPLE_UUID);

    expect(prismaMock.feedback.delete).toHaveBeenCalledWith({
      where: { id: EXAMPLE_UUID },
    });
    expect(s3Mock.deleteObject).not.toHaveBeenCalled();
  });

  it('deletes DB record and skips storage when avatar is an external URL', async () => {
    prismaMock.feedback.findUnique.mockResolvedValue({
      avatar: 'https://cdn.example.com/photo.jpg',
    });
    prismaMock.feedback.delete.mockResolvedValue(undefined);

    await useCase.execute(EXAMPLE_UUID);

    expect(prismaMock.feedback.delete).toHaveBeenCalled();
    expect(s3Mock.deleteObject).not.toHaveBeenCalled();
  });

  it('deletes DB record and removes internal S3 key from storage', async () => {
    prismaMock.feedback.findUnique.mockResolvedValue({
      avatar: 'feedbacks/123_uuid.jpg',
    });
    prismaMock.feedback.delete.mockResolvedValue(undefined);
    s3Mock.deleteObject.mockResolvedValue(undefined);

    await useCase.execute(EXAMPLE_UUID);

    expect(prismaMock.feedback.delete).toHaveBeenCalled();
    expect(s3Mock.deleteObject).toHaveBeenCalledWith('feedbacks/123_uuid.jpg');
  });

  it('still deletes the DB record even when storage deletion fails', async () => {
    prismaMock.feedback.findUnique.mockResolvedValue({
      avatar: 'feedbacks/abc.jpg',
    });
    prismaMock.feedback.delete.mockResolvedValue(undefined);
    s3Mock.deleteObject.mockRejectedValue(new Error('S3 network error'));

    await expect(useCase.execute(EXAMPLE_UUID)).resolves.toBeUndefined();
    expect(prismaMock.feedback.delete).toHaveBeenCalled();
  });
});
