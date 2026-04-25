import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectUseCase } from './use-cases/create-project.usecase';
import { DeleteProjectUseCase } from './use-cases/delete-project.usecase';
import { FindByCategoryUseCase } from './use-cases/find-by-category.usecase';
import { GetProjectUseCase } from './use-cases/get-project-by-id.usecase';
import { ListProjectsUseCase } from './use-cases/list-projects.usecase';
import { UpdateProjectUseCase } from './use-cases/update-project.usecase';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    CreateProjectUseCase,
    ListProjectsUseCase,
    GetProjectUseCase,
    FindByCategoryUseCase,
    UpdateProjectUseCase,
    DeleteProjectUseCase,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
