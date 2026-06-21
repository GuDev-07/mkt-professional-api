import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { isExternalUrl } from '../../../common/utils/media-url';
import { PrismaService } from '../../../prisma/prisma.service';
import { S3StorageService } from '../../uploads/s3-storage.service';

@Injectable()
export class DeleteFeedbackUseCase {
  private readonly logger = new Logger(DeleteFeedbackUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
  ) {}

  async execute(id: string): Promise<void> {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      select: { avatar: true },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback com id ${id} não encontrado`);
    }

    await this.prisma.feedback.delete({ where: { id } });

    await this.cleanupAvatar(feedback.avatar);
  }

  private async cleanupAvatar(avatar: string | null): Promise<void> {
    if (!avatar || isExternalUrl(avatar)) return;

    try {
      await this.storage.deleteObject(avatar);
      this.logger.log(`Avatar removido do storage: ${avatar}`);
    } catch (err) {
      // Não cancela o delete do registro — apenas registra a falha.
      this.logger.error(
        `Falha ao remover avatar do storage: ${avatar}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
