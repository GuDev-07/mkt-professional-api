import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DeleteProjectUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: bigint): Promise<void> {
    try {
      await this.prisma.project.delete({ where: { id } });
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
