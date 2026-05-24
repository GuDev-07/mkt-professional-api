import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateProjectRequestDto } from '../dto/request/update-project-request.dto';

@Injectable()
export class UpdateProjectUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: bigint, data: UpdateProjectRequestDto): Promise<Project> {
    try {
      const imageValue = data.imageKey ?? data.imageUrl;
      const updateData: {
        title?: string;
        category?: Project['category'];
        description?: string;
        client?: string | null;
        imageUrl?: string;
      } = {
        title: data.title,
        category: data.category,
        description: data.description,
        client: data.client,
      };

      if (imageValue) {
        updateData.imageUrl = imageValue;
      }

      return await this.prisma.project.update({
        where: { id },
        data: updateData,
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
