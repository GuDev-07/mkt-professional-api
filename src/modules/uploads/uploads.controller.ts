import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { UploadsService } from './uploads.service';

class RequestUploadUrlDto {
  originalName!: string;
  contentType!: string;
}

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Returns a short-lived presigned S3 PUT URL so the client can upload
   * the file directly to storage without routing binary data through this API.
   * After the upload completes, use the returned `key` when creating/updating content.
   */
  @Post('presigned-url')
  @UseGuards(AdminGuard, ThrottlerGuard)
  @Throttle({
    default: {
      limit: parsePositiveInt(process.env.UPLOAD_RATE_LIMIT, 30),
      ttl: parsePositiveInt(process.env.UPLOAD_RATE_TTL, 60),
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Request a presigned S3 URL for direct browser-to-storage upload',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['originalName', 'contentType'],
      properties: {
        originalName: { type: 'string', example: 'foto-campanha.jpg' },
        contentType: { type: 'string', example: 'image/jpeg' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns presigned uploadUrl, the storage key, and expiry in seconds.',
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        uploadUrl: { type: 'string' },
        expiresIn: { type: 'number' },
      },
    },
  })
  async requestPresignedUpload(
    @Body() body: RequestUploadUrlDto,
  ): Promise<{ key: string; uploadUrl: string; expiresIn: number }> {
    if (!body.originalName || !body.contentType) {
      throw new BadRequestException('originalName e contentType são obrigatórios');
    }

    if (!ALLOWED_CONTENT_TYPES.includes(body.contentType)) {
      throw new BadRequestException(
        `Tipo de arquivo inválido. Permitidos: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
      );
    }

    return this.uploadsService.requestPresignedUpload(
      body.originalName,
      body.contentType,
    );
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
