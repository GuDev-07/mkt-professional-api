import { Injectable, NotFoundException } from '@nestjs/common';
import { Feedback, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UploadImageFile } from '../../uploads/upload-image.utils';
import { UploadsService } from '../../uploads/uploads.service';
import { UpdateFeedbackRequestDto } from '../dto/request/update-feedback-request.dto';

@Injectable()
export class UpdateFeedbackUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async execute(
    id: string,
    file: UploadImageFile | undefined,
    data: UpdateFeedbackRequestDto,
  ): Promise<Feedback> {
    const patch: Prisma.FeedbackUpdateInput = {};

    if (data.name !== undefined) patch.name = data.name;
    if (data.company !== undefined) patch.company = data.company;
    if (data.comment !== undefined) patch.comment = data.comment;
    if (data.jobTitle !== undefined) patch.jobTitle = data.jobTitle;

    if (file) {
      const { key } = await this.uploads.processImageUpload(file, 'feedbacks/');
      patch.avatar = key;
    } else if (data.avatarUrl !== undefined) {
      patch.avatar = data.avatarUrl;
    }

    try {
      return await this.prisma.feedback.update({ where: { id }, data: patch });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException(`Feedback com id ${id} não encontrado`);
      }
      throw err;
    }
  }
}
