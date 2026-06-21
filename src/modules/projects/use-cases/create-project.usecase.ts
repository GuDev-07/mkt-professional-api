import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UploadImageFile } from '../../uploads/upload-image.utils';
import { UploadsService } from '../../uploads/uploads.service';
import { CreateProjectRequestDto } from '../dto/request/create-project-request.dto';

@Injectable()
export class CreateProjectUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async execute(
    file: UploadImageFile,
    data: CreateProjectRequestDto,
  ): Promise<Project> {
    const { key } = await this.uploads.processImageUpload(file);

    return this.prisma.project.create({
      data: {
        title: data.title,
        category: data.category,
        description: data.description,
        client: data.client,
        imageUrl: key,
      },
    });
  }
}
