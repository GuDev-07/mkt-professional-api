import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { EXAMPLE_UUID, OTHER_UUID } from '../../../common/constants/uuid.example';
import { PrismaService } from '../../../prisma/prisma.service';
import { S3StorageService } from '../../uploads/s3-storage.service';
import { ProjectsController } from '../projects.controller';
import { ProjectsService } from '../projects.service';
import { DeleteProjectUseCase } from '../use-cases/delete-project.usecase';

const alwaysAllow = { canActivate: () => true };

describe('Delete Project – controller (unit)', () => {
  let controller: ProjectsController;

  const projectsServiceMock = { remove: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: projectsServiceMock }],
    })
      .overrideGuard(AdminGuard)
      .useValue(alwaysAllow)
      .overrideGuard(ThrottlerGuard)
      .useValue(alwaysAllow)
      .compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('delegates to service.remove with uuid id', async () => {
    projectsServiceMock.remove.mockResolvedValue(undefined);
    await controller.remove(EXAMPLE_UUID);
    expect(projectsServiceMock.remove).toHaveBeenCalledWith(EXAMPLE_UUID);
  });
});

describe('DeleteProjectUseCase', () => {
  let useCase: DeleteProjectUseCase;

  const prismaMock = {
    project: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const s3Mock = { deleteObject: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteProjectUseCase,
        { provide: PrismaService, useValue: prismaMock },
        { provide: S3StorageService, useValue: s3Mock },
      ],
    }).compile();

    useCase = module.get<DeleteProjectUseCase>(DeleteProjectUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('throws NotFoundException when project does not exist', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);
    await expect(useCase.execute(OTHER_UUID)).rejects.toThrow(NotFoundException);
    expect(prismaMock.project.delete).not.toHaveBeenCalled();
    expect(s3Mock.deleteObject).not.toHaveBeenCalled();
  });

  it('deletes DB record and removes internal S3 key', async () => {
    prismaMock.project.findUnique.mockResolvedValue({
      imageUrl: 'projects/abc_uuid.jpg',
    });
    prismaMock.project.delete.mockResolvedValue(undefined);
    s3Mock.deleteObject.mockResolvedValue(undefined);

    await useCase.execute(EXAMPLE_UUID);

    expect(prismaMock.project.delete).toHaveBeenCalledWith({
      where: { id: EXAMPLE_UUID },
    });
    expect(s3Mock.deleteObject).toHaveBeenCalledWith('projects/abc_uuid.jpg');
  });

  it('skips S3 when imageUrl is an external URL', async () => {
    prismaMock.project.findUnique.mockResolvedValue({
      imageUrl: 'https://cdn.example.com/image.jpg',
    });
    prismaMock.project.delete.mockResolvedValue(undefined);

    await useCase.execute(EXAMPLE_UUID);

    expect(prismaMock.project.delete).toHaveBeenCalled();
    expect(s3Mock.deleteObject).not.toHaveBeenCalled();
  });

  it('still deletes the DB record even when S3 deletion fails', async () => {
    prismaMock.project.findUnique.mockResolvedValue({
      imageUrl: 'projects/abc_uuid.jpg',
    });
    prismaMock.project.delete.mockResolvedValue(undefined);
    s3Mock.deleteObject.mockRejectedValue(new Error('S3 timeout'));

    await expect(useCase.execute(EXAMPLE_UUID)).resolves.toBeUndefined();
    expect(prismaMock.project.delete).toHaveBeenCalled();
  });
});
