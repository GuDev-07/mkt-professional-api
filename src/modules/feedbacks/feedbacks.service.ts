import { Injectable } from '@nestjs/common';
import { Feedback } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeedbackRequestDto } from './dto/request/create-feedback-request.dto';
import { UpdateFeedbackRequestDto } from './dto/request/update-feedback-request.dto';

@Injectable()
export class FeedbacksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Feedback[]> {
    return this.prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateFeedbackRequestDto): Promise<Feedback> {
    return this.prisma.feedback.create({ data });
  }

  async update(id: bigint, data: UpdateFeedbackRequestDto): Promise<Feedback> {
    return this.prisma.feedback.update({
      where: { id },
      data,
    });
  }

  async remove(id: bigint): Promise<Feedback> {
    return this.prisma.feedback.delete({
      where: { id },
    });
  }
}
