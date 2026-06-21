import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Feedback } from '@prisma/client';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CreateFeedbackRequestDto } from './dto/request/create-feedback-request.dto';
import { UpdateFeedbackRequestDto } from './dto/request/update-feedback-request.dto';
import { FeedbackResponseDto } from './dto/response/feedback-response.dto';
import { FeedbacksService } from './feedbacks.service';

const ADMIN_THROTTLE = {
  default: {
    limit: parsePositiveInt(process.env.ADMIN_RATE_LIMIT, 100),
    ttl: parsePositiveInt(process.env.ADMIN_RATE_TTL, 60),
  },
};

@ApiTags('feedbacks')
@Controller('feedbacks')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all feedbacks' })
  @ApiResponse({
    status: 200,
    description: 'List of feedbacks',
    type: FeedbackResponseDto,
    isArray: true,
  })
  async findAll(): Promise<Feedback[]> {
    return this.feedbacksService.findAll();
  }

  @Post()
  @UseGuards(AdminGuard, ThrottlerGuard)
  @Throttle(ADMIN_THROTTLE)
  @ApiOperation({ summary: 'Create a new feedback' })
  @ApiResponse({
    status: 201,
    description: 'Feedback created',
    type: FeedbackResponseDto,
  })
  async create(@Body() data: CreateFeedbackRequestDto): Promise<Feedback> {
    return this.feedbacksService.create(data);
  }

  @Patch(':id')
  @UseGuards(AdminGuard, ThrottlerGuard)
  @Throttle(ADMIN_THROTTLE)
  @ApiOperation({ summary: 'Update a feedback' })
  @ApiResponse({
    status: 200,
    description: 'Feedback updated',
    type: FeedbackResponseDto,
  })
  async update(
    @Param('id') id: number,
    @Body() data: UpdateFeedbackRequestDto,
  ): Promise<Feedback> {
    return this.feedbacksService.update(BigInt(id), data);
  }

  @Delete(':id')
  @UseGuards(AdminGuard, ThrottlerGuard)
  @Throttle(ADMIN_THROTTLE)
  @ApiOperation({ summary: 'Delete a feedback' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.feedbacksService.remove(BigInt(id));
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
