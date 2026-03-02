import { Injectable } from '@nestjs/common';
import { Project, ProjectCategory } from '@prisma/client';
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
      data,
    });
  }

  async remove(id: bigint): Promise<Project> {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
