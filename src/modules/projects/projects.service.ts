import { Injectable, NotFoundException } from '@nestjs/common';
import { Project } from '@prisma/client';
import { ProjectCategory } from '../../enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectRequestDto } from './dto/request/create-project-request.dto';
import { UpdateProjectRequestDto } from './dto/request/update-project-request.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: bigint): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
    });
  }

  async findByCategory(category: ProjectCategory): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateProjectRequestDto): Promise<Project> {
    return this.prisma.project.create({ data });
  }

  async update(id: bigint, data: UpdateProjectRequestDto): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        category: data.category,
        description: data.description,
        client: data.client,
        imageUrl: data.imageUrl,
      },
    });
  }

  async remove(id: bigint): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    await this.prisma.project.delete({ where: { id } });
  }
}
