import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { isExternalUrl } from '../../../common/utils/media-url';
import { PrismaService } from '../../../prisma/prisma.service';
import { S3StorageService } from '../../uploads/s3-storage.service';

@Injectable()
export class DeleteProjectUseCase {
  private readonly logger = new Logger(DeleteProjectUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
  ) {}

  async execute(id: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    await this.prisma.project.delete({ where: { id } });

    await this.cleanupImage(project.imageUrl);
  }

  private async cleanupImage(imageUrl: string): Promise<void> {
    if (!imageUrl || isExternalUrl(imageUrl)) return;

    try {
      await this.storage.deleteObject(imageUrl);
      this.logger.log(`Imagem removida do storage: ${imageUrl}`);
    } catch (err) {
      this.logger.error(
        `Falha ao remover imagem do storage: ${imageUrl}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
