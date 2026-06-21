import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Feedback } from '@prisma/client';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { EXAMPLE_UUID } from '../../common/constants/uuid.example';
import { isUploadImageFile } from '../uploads/upload-image.utils';
import { CreateFeedbackRequestDto } from './dto/request/create-feedback-request.dto';
import { normalizeFeedbackFields } from './dto/request/feedback-field.utils';
import { UpdateFeedbackRequestDto } from './dto/request/update-feedback-request.dto';
import { FeedbackResponseDto } from './dto/response/feedback-response.dto';
import { FeedbacksService } from './feedbacks.service';

const UPLOAD_THROTTLE = {
  default: {
    limit: parsePositiveInt(process.env.UPLOAD_RATE_LIMIT, 30),
    ttl: parsePositiveInt(process.env.UPLOAD_RATE_TTL, 60),
  },
};

const ADMIN_THROTTLE = {
  default: {
    limit: parsePositiveInt(process.env.ADMIN_RATE_LIMIT, 100),
    ttl: parsePositiveInt(process.env.ADMIN_RATE_TTL, 60),
  },
};

const AVATAR_UPLOAD = FileInterceptor('avatar', {
  storage: memoryStorage(),
  limits: {
    fileSize:
      (parseInt(process.env.UPLOAD_MAX_MB ?? '5', 10) || 5) * 1024 * 1024,
  },
});

const FEEDBACK_FORM_BODY = {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Juliana Paes' },
      company: { type: 'string', example: 'Bloom' },
      comment: {
        type: 'string',
        example: 'Extremamente profissional e criativa.',
      },
      job_title: { type: 'string', example: 'Fundadora da Bloom' },
      jobTitle: { type: 'string', example: 'Fundadora da Bloom' },
      avatar: { type: 'string', format: 'binary' },
      avatar_url: { type: 'string', example: 'https://example.com/photo.jpg' },
    },
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
  @Throttle(UPLOAD_THROTTLE)
  @UseInterceptors(AVATAR_UPLOAD)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new feedback with optional person photo' })
  @ApiBody({
    ...FEEDBACK_FORM_BODY,
    schema: { ...FEEDBACK_FORM_BODY.schema, required: ['name'] },
  })
  @ApiResponse({
    status: 201,
    description: 'Feedback created',
    type: FeedbackResponseDto,
  })
  async create(
    @UploadedFile() file: unknown,
    @Req() req: Request,
    @Body() body: CreateFeedbackRequestDto,
  ): Promise<Feedback> {
    const avatar = isUploadImageFile(file) ? file : undefined;
    const payload = mergeFeedbackBody(
      req.body as Record<string, unknown>,
      body,
    );
    return this.feedbacksService.create(avatar, payload);
  }

  @Patch(':id')
  @UseGuards(AdminGuard, ThrottlerGuard)
  @Throttle(ADMIN_THROTTLE)
  @UseInterceptors(AVATAR_UPLOAD)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a feedback' })
  @ApiParam({ name: 'id', example: EXAMPLE_UUID })
  @ApiBody(FEEDBACK_FORM_BODY)
  @ApiResponse({
    status: 200,
    description: 'Feedback updated',
    type: FeedbackResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: unknown,
    @Req() req: Request,
    @Body() data: UpdateFeedbackRequestDto,
  ): Promise<Feedback> {
    const avatar = isUploadImageFile(file) ? file : undefined;
    const payload = mergeFeedbackBody(
      req.body as Record<string, unknown>,
      data,
    );
    return this.feedbacksService.update(id, avatar, payload);
  }

  @Delete(':id')
  @UseGuards(AdminGuard, ThrottlerGuard)
  @Throttle(ADMIN_THROTTLE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a feedback' })
  @ApiParam({ name: 'id', example: EXAMPLE_UUID })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.feedbacksService.remove(id);
  }
}

function mergeFeedbackBody<
  T extends CreateFeedbackRequestDto | UpdateFeedbackRequestDto,
>(raw: Record<string, unknown>, dto: T): T {
  const normalized = normalizeFeedbackFields(raw);
  return { ...dto, ...normalized } as T;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
