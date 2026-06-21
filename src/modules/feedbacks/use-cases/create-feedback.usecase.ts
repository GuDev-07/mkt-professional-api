import { Injectable } from '@nestjs/common';
import { Feedback } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UploadImageFile } from '../../uploads/upload-image.utils';
import { UploadsService } from '../../uploads/uploads.service';
import { CreateFeedbackRequestDto } from '../dto/request/create-feedback-request.dto';

@Injectable()
export class CreateFeedbackUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async execute(
    file: UploadImageFile | undefined,
    data: CreateFeedbackRequestDto,
  ): Promise<Feedback> {
    let avatar: string | null = data.avatarUrl ?? null;

    if (file) {
      const { key } = await this.uploads.processImageUpload(file, 'feedbacks/');
      avatar = key;
    }

    return this.prisma.feedback.create({
      data: {
        name: data.name,
        company: data.company ?? null,
        comment: data.comment ?? null,
        jobTitle: data.jobTitle ?? null,
        avatar,
      },
    });
  }
}
