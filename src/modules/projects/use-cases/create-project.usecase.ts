import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProjectRequestDto } from '../dto/request/create-project-request.dto';

@Injectable()
export class CreateProjectUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: CreateProjectRequestDto): Promise<Project> {
    return await this.prisma.project.create({ data });
  }
}
