import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ProjectCategory } from '@prisma/client';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { EXAMPLE_UUID } from '../../../common/constants/uuid.example';
import { ProjectsController } from '../projects.controller';
import { ProjectsService } from '../projects.service';

const alwaysAllow = { canActivate: () => true };

describe('Create Project (unit)', () => {
  let controller: ProjectsController;

  const projectsServiceMock = {
    create: jest.fn(),
  };

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
    projectsServiceMock.create.mockClear();
  });

  afterEach(() => jest.clearAllMocks());

  it('throws BadRequestException when no file is provided', async () => {
    await expect(
      controller.create(undefined, {} as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when file shape is invalid', async () => {
    await expect(
      controller.create({ notAFile: true }, {} as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('calls service.create with the file and body, returns result', async () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
    const file = {
      buffer: jpegBuffer,
      mimetype: 'image/jpeg',
      originalname: 'image.jpg',
    };
    const body = {
      title: 'Campanha',
      category: ProjectCategory.BRANDING_IDENTIDADE,
      description: 'Desc',
      client: 'Client X',
    };
    const created = { id: EXAMPLE_UUID, ...body, imageUrl: 'projects/img.jpg' };
    projectsServiceMock.create.mockResolvedValue(created);

    const result = await controller.create(file as any, body as any);

    expect(projectsServiceMock.create).toHaveBeenCalledWith(file, body);
    expect(result).toEqual(created);
  });
});
