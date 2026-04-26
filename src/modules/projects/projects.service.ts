import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { ProjectCategory } from '../../enums';
import { CreateProjectRequestDto } from './dto/request/create-project-request.dto';
import { UpdateProjectRequestDto } from './dto/request/update-project-request.dto';
import { CreateProjectUseCase } from './use-cases/create-project.usecase';
import { DeleteProjectUseCase } from './use-cases/delete-project.usecase';
import { FindByCategoryUseCase } from './use-cases/find-by-category.usecase';
import { GetProjectUseCase } from './use-cases/get-project-by-id.usecase';
import { ListProjectsUseCase } from './use-cases/list-projects.usecase';
import { UpdateProjectUseCase } from './use-cases/update-project.usecase';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly createProject: CreateProjectUseCase,
    private readonly listProjects: ListProjectsUseCase,
    private readonly getProject: GetProjectUseCase,
    private readonly findByCategoryUseCase: FindByCategoryUseCase,
    private readonly updateProject: UpdateProjectUseCase,
    private readonly deleteProject: DeleteProjectUseCase,
  ) {}

  async findAll(): Promise<Project[]> {
    return this.listProjects.execute();
  }

  async findOne(id: bigint): Promise<Project | null> {
    return this.getProject.execute(id);
  }

  async findByCategory(category: ProjectCategory): Promise<Project[]> {
    return this.findByCategoryUseCase.execute(category);
  }

  async create(data: CreateProjectRequestDto): Promise<Project> {
    return this.createProject.execute(data);
  }

  async update(id: bigint, data: UpdateProjectRequestDto): Promise<Project> {
    return this.updateProject.execute(id, data);
  }

  async remove(id: bigint): Promise<void> {
    return this.deleteProject.execute(id);
  }
}
