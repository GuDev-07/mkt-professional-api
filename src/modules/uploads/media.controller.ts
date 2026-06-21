import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { Readable } from 'stream';
import {
  isMediaSigningEnabled,
  verifyMediaSignature,
} from '../../common/utils/media-url';
import { S3StorageService } from './s3-storage.service';

@Controller('media')
@UseGuards(ThrottlerGuard)
export class MediaController {
  constructor(private readonly storage: S3StorageService) {}

  @Get('*key')
  @Throttle({
    default: {
      limit: parsePositiveInt(process.env.MEDIA_RATE_LIMIT, 120),
      ttl: parsePositiveInt(process.env.MEDIA_RATE_TTL, 60),
    },
  })
  async stream(
    @Param('key') keyParam: string,
    @Query('token') token: string | undefined,
    @Query('expires') expiresParam: string | undefined,
    @Res() res: Response,
  ) {
    const key = safeDecode(keyParam);
    const now = Math.floor(Date.now() / 1000);

    if (isMediaSigningEnabled()) {
      if (!token || !expiresParam) {
        throw new ForbiddenException('Acesso expirado ou invalido');
      }

      const expires = Number.parseInt(expiresParam, 10);
      if (!Number.isFinite(expires) || expires <= now) {
        throw new ForbiddenException('Acesso expirado ou invalido');
      }

      if (!verifyMediaSignature(key, expires, token)) {
        throw new ForbiddenException('Acesso expirado ou invalido');
      }
    }

    try {
      const result = await this.storage.getObject(key);

      if (!result.Body) {
        throw new NotFoundException('Arquivo não encontrado');
      }

      if (result.ContentType) {
        res.setHeader('Content-Type', result.ContentType);
      }

      if (result.ContentLength) {
        res.setHeader('Content-Length', result.ContentLength.toString());
      }

      const cacheMaxAge = parsePositiveInt(
        process.env.MEDIA_CACHE_MAX_AGE,
        3600,
      );
      const sharedMaxAge = parsePositiveInt(
        process.env.MEDIA_CACHE_SHARED_MAX_AGE,
        cacheMaxAge,
      );
      const effectiveMaxAge =
        isMediaSigningEnabled() && expiresParam
          ? Math.max(
              0,
              Math.min(cacheMaxAge, Number.parseInt(expiresParam, 10) - now),
            )
          : cacheMaxAge;
      const cacheControl = isMediaSigningEnabled()
        ? `private, max-age=${effectiveMaxAge}`
        : `public, max-age=${effectiveMaxAge}, s-maxage=${sharedMaxAge}, immutable`;

      res.setHeader('Cache-Control', cacheControl);

      const stream = result.Body as Readable;
      stream.pipe(res);
    } catch {
      throw new NotFoundException('Arquivo não encontrado');
    }
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new NotFoundException('Arquivo não encontrado');
  }
}
