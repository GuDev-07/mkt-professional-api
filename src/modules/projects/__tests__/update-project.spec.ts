/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ProjectCategory } from '@prisma/client';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { EXAMPLE_UUID } from '../../../common/constants/uuid.example';
import { ProjectsController } from '../projects.controller';
import { ProjectsService } from '../projects.service';

const alwaysAllow = { canActivate: () => true };

describe('Update Project (unit)', () => {
  let controller: ProjectsController;

  const projectsServiceMock = {
    update: jest.fn(),
  } as unknown as ProjectsService;

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

  it('calls service.update and returns updated project', async () => {
    const dto = { title: 'Updated Title' };
    const updated = {
      id: EXAMPLE_UUID,
      title: 'Updated Title',
      category: 'BRANDING_IDENTIDADE' as ProjectCategory,
      description: 'Desc',
      client: null,
      imageUrl: 'http://img',
      createdAt: new Date(),
    };
    projectsServiceMock.update = jest.fn().mockResolvedValue(updated);

    const result = await controller.update(EXAMPLE_UUID, dto);

    expect(projectsServiceMock.update).toHaveBeenCalledWith(EXAMPLE_UUID, dto);
    expect(result).toEqual(updated);
  });
});
