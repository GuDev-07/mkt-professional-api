import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateProjectRequestDto } from '../dto/request/update-project-request.dto';

@Injectable()
export class UpdateProjectUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: bigint, data: UpdateProjectRequestDto): Promise<Project> {
    try {
      return await this.prisma.project.update({
        where: { id },
        data: {
          title: data.title,
          category: data.category,
          description: data.description,
          client: data.client,
          imageUrl: data.imageUrl,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException(`Project with id ${id} not found`);
      }
      throw err;
    }
  }
}
