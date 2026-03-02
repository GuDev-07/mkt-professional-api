import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { ProjectsController } from '../projects.controller';
import { ProjectsService } from '../projects.service';

describe('Delete Project (unit)', () => {
  let controller: ProjectsController;

  const projectsServiceMock = {
    remove: jest.fn(),
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

  it('calls service.remove', async () => {
    projectsServiceMock.remove = jest
      .fn()
      .mockResolvedValue({ id: BigInt(1) } as any);

    await controller.remove('1');

    expect(
      projectsServiceMock.remove.bind(projectsServiceMock),
    ).toHaveBeenCalledWith(BigInt(1));
  });
});
