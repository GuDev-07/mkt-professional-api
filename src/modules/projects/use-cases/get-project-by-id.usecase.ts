import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GetProjectUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: bigint): Promise<Project | null> {
    return await this.prisma.project.findUnique({ where: { id } });
  }
}
