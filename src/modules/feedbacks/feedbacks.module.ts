import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadsModule } from '../uploads/uploads.module';
import { FeedbacksController } from './feedbacks.controller';
import { FeedbacksService } from './feedbacks.service';
import { CreateFeedbackUseCase } from './use-cases/create-feedback.usecase';
import { DeleteFeedbackUseCase } from './use-cases/delete-feedback.usecase';
import { ListFeedbacksUseCase } from './use-cases/list-feedbacks.usecase';
import { UpdateFeedbackUseCase } from './use-cases/update-feedback.usecase';

@Module({
  imports: [PrismaModule, AuthModule, UploadsModule],
  controllers: [FeedbacksController],
  providers: [
    FeedbacksService,
    ListFeedbacksUseCase,
    CreateFeedbackUseCase,
    UpdateFeedbackUseCase,
    DeleteFeedbackUseCase,
  ],
  exports: [FeedbacksService],
})
export class FeedbacksModule {}
