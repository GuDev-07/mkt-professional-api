import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ListProjectsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<Project[]> {
    return await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
