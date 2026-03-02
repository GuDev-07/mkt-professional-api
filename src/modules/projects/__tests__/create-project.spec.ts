import { Test, TestingModule } from '@nestjs/testing';
import { ProjectCategory } from '@prisma/client';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { ProjectsController } from '../projects.controller';
import { ProjectsService } from '../projects.service';

describe('Create Project (unit)', () => {
  let controller: ProjectsController;

  const projectsServiceMock = {
    create: jest.fn() as jest.MockedFunction<typeof projectsServiceMock.create>,
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
    (projectsServiceMock.create as jest.Mock).mockClear();
  });

  afterEach(() => jest.clearAllMocks());

  it('calls service.create and returns created project', async () => {
    const dto = {
      title: 'New Project',
      category: ProjectCategory.BRANDING_IDENTIDADE,
      description: 'Desc',
      client: 'Client',
      imageUrl: 'http://img',
    };

    const created = { id: BigInt(1), ...dto };
    (projectsServiceMock.create as jest.Mock).mockResolvedValue(created);

    const result = await controller.create(dto);

    expect(
      (
        (projectsServiceMock.create as jest.Mock).mock.calls as unknown[][]
      )[0][0],
    ).toEqual(dto);
    expect(result).toEqual(created);
  });
});
