import { Injectable, NotFoundException } from '@nestjs/common';
import { Project } from '@prisma/client';
import { ProjectCategory } from '../../../enums';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class FindByCategoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(category: ProjectCategory): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    });

    if (projects.length === 0) {
      throw new NotFoundException(
        'Nenhum projeto esta postado para essa categoria',
      );
    }

    return projects;
  }
}
