import { Injectable } from '@nestjs/common';
import { Feedback } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ListFeedbacksUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<Feedback[]> {
    return this.prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
