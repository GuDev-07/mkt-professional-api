import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import {
  buildProxyUrl,
  isDirectPresignEnabled,
  isExternalUrl,
} from '../../common/utils/media-url';
import { S3StorageService } from '../uploads/s3-storage.service';
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
    private readonly storage: S3StorageService,
  ) {}

  async findAll(): Promise<Project[]> {
    const projects = await this.listProjects.execute();
    return Promise.all(projects.map((p) => this.mapProject(p)));
  }

  async findOne(id: bigint): Promise<Project | null> {
    const project = await this.getProject.execute(id);
    return project ? this.mapProject(project) : null;
  }

  async findByCategory(category: ProjectCategory): Promise<Project[]> {
    const projects = await this.findByCategoryUseCase.execute(category);
    return Promise.all(projects.map((p) => this.mapProject(p)));
  }

  async create(data: CreateProjectRequestDto): Promise<Project> {
    const project = await this.createProject.execute(data);
    return this.mapProject(project);
  }

  async update(id: bigint, data: UpdateProjectRequestDto): Promise<Project> {
    const project = await this.updateProject.execute(id, data);
    return this.mapProject(project);
  }

  async remove(id: bigint): Promise<void> {
    return this.deleteProject.execute(id);
  }

  private async mapProject(project: Project): Promise<Project> {
    const value = project.imageUrl;
    if (!value) {
      return project;
    }

    if (isExternalUrl(value)) {
      return project;
    }

    if (isDirectPresignEnabled()) {
      const imageUrl = await this.storage.getPresignedDownloadUrl(value);
      return { ...project, imageUrl };
    }

    return { ...project, imageUrl: buildProxyUrl(value) };
  }
}
