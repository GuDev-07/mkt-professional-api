import { Injectable } from '@nestjs/common';
import { Feedback } from '@prisma/client';
import {
  buildProxyUrl,
  isDirectPresignEnabled,
  isExternalUrl,
} from '../../common/utils/media-url';
import { S3StorageService } from '../uploads/s3-storage.service';
import { UploadImageFile } from '../uploads/upload-image.utils';
import { CreateFeedbackRequestDto } from './dto/request/create-feedback-request.dto';
import { UpdateFeedbackRequestDto } from './dto/request/update-feedback-request.dto';
import { CreateFeedbackUseCase } from './use-cases/create-feedback.usecase';
import { DeleteFeedbackUseCase } from './use-cases/delete-feedback.usecase';
import { ListFeedbacksUseCase } from './use-cases/list-feedbacks.usecase';
import { UpdateFeedbackUseCase } from './use-cases/update-feedback.usecase';

@Injectable()
export class FeedbacksService {
  constructor(
    private readonly listFeedbacks: ListFeedbacksUseCase,
    private readonly createFeedback: CreateFeedbackUseCase,
    private readonly updateFeedback: UpdateFeedbackUseCase,
    private readonly deleteFeedback: DeleteFeedbackUseCase,
    private readonly storage: S3StorageService,
  ) {}

  async findAll(): Promise<Feedback[]> {
    const feedbacks = await this.listFeedbacks.execute();
    return Promise.all(feedbacks.map((f) => this.mapFeedback(f)));
  }

  async create(
    file: UploadImageFile | undefined,
    data: CreateFeedbackRequestDto,
  ): Promise<Feedback> {
    const feedback = await this.createFeedback.execute(file, data);
    return this.mapFeedback(feedback);
  }

  async update(
    id: string,
    file: UploadImageFile | undefined,
    data: UpdateFeedbackRequestDto,
  ): Promise<Feedback> {
    const feedback = await this.updateFeedback.execute(id, file, data);
    return this.mapFeedback(feedback);
  }

  async remove(id: string): Promise<void> {
    return this.deleteFeedback.execute(id);
  }

  private async mapFeedback(feedback: Feedback): Promise<Feedback> {
    const value = feedback.avatar;
    if (!value) return feedback;
    if (isExternalUrl(value)) return feedback;

    if (isDirectPresignEnabled()) {
      const avatar = await this.storage.getPresignedDownloadUrl(value);
      return { ...feedback, avatar };
    }

    return { ...feedback, avatar: buildProxyUrl(value) };
  }
}
