/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { ProjectCategory } from '@prisma/client';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { ProjectsController } from '../projects.controller';
import { ProjectsService } from '../projects.service';

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
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('calls service.update and returns updated project', async () => {
    const dto = { title: 'Updated Title' };
    const updated = {
      id: BigInt(1),
      title: 'Updated Title',
      category: 'BRANDING_IDENTIDADE' as ProjectCategory,
      description: 'Desc',
      client: null,
      imageUrl: 'http://img',
      createdAt: new Date(),
    };
    projectsServiceMock.update = jest.fn().mockResolvedValue(updated);

    const result = await controller.update('1', dto);

    expect(projectsServiceMock.update).toHaveBeenCalledWith(BigInt(1), dto);
    expect(result).toEqual(updated);
  });
});
