import { BadRequestException, Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProjectRequestDto } from '../dto/request/create-project-request.dto';

@Injectable()
export class CreateProjectUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: CreateProjectRequestDto): Promise<Project> {
    const imageValue = data.imageKey ?? data.imageUrl;

    if (!imageValue) {
      throw new BadRequestException('image_url ou image_key é obrigatório');
    }

    return await this.prisma.project.create({
      data: {
        title: data.title,
        category: data.category,
        description: data.description,
        client: data.client,
        imageUrl: imageValue,
      },
    });
  }
}
