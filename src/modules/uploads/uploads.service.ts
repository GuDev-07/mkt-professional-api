import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { extname } from 'path';
import { buildProxyUrl } from '../../common/utils/media-url';
import { S3StorageService } from './s3-storage.service';
import {
  detectImageMimeType,
  UploadImageFile,
} from './upload-image.utils';

export type { UploadImageFile } from './upload-image.utils';
export { isUploadImageFile } from './upload-image.utils';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'] as const;

@Injectable()
export class UploadsService {
  constructor(private readonly storage: S3StorageService) {}

  buildKey(originalName: string, mimeType: string, prefix?: string): string {
    const resolvedPrefix = (
      prefix ??
      process.env.SUPABASE_UPLOAD_PREFIX ??
      'projects/'
    ).replace(/^\/+/, '');
    const ext = extname(originalName) || this.fallbackExtension(mimeType);
    return `${resolvedPrefix}${Date.now()}_${randomUUID()}${ext}`;
  }

  /**
   * Validates magic bytes and MIME type, uploads to S3 and returns the stored key.
   * This is the primary method use-cases should call for image uploads.
   */
  async processImageUpload(
    file: UploadImageFile,
    prefix?: string,
  ): Promise<{ key: string; url: string }> {
    this.validateImageFile(file);
    return this.uploadImage(file, prefix);
  }

  /**
   * Validates the file content against its declared MIME type using magic bytes.
   * Throws BadRequestException when the file is not a valid jpg/png.
   */
  validateImageFile(file: UploadImageFile): void {
    const detected = detectImageMimeType(file.buffer);
    if (!detected) {
      throw new BadRequestException('Arquivo não é uma imagem válida');
    }
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(detected)) {
      throw new BadRequestException('Tipo de arquivo inválido (jpg/png)');
    }
    if (file.mimetype !== detected) {
      throw new BadRequestException(
        'Tipo de arquivo inválido: MIME declarado não corresponde ao conteúdo',
      );
    }
  }

  async uploadImage(
    file: UploadImageFile,
    prefix?: string,
  ): Promise<{ key: string; url: string }> {
    await this.scanIfConfigured(file);
    const key = this.buildKey(file.originalname, file.mimetype, prefix);
    await this.storage.uploadObject(key, file.buffer, file.mimetype);

    return { key, url: buildProxyUrl(key) };
  }

  async requestPresignedUpload(
    originalName: string,
    contentType: string,
  ): Promise<{ key: string; uploadUrl: string; expiresIn: number }> {
    const key = this.buildKey(originalName, contentType);
    const expiresIn = parsePositiveInt(
      process.env.PRESIGNED_UPLOAD_TTL_SECONDS,
      300,
    );
    const uploadUrl = await this.storage.getPresignedUploadUrl(
      key,
      contentType,
      expiresIn,
    );

    return { key, uploadUrl, expiresIn };
  }

  private fallbackExtension(mimeType: string): string {
    if (mimeType === 'image/png') {
      return '.png';
    }
    return '.jpg';
  }

  private async scanIfConfigured(file: UploadImageFile): Promise<void> {
    const scanUrl = process.env.UPLOADS_SCAN_URL;
    if (!scanUrl) {
      return;
    }

    const timeoutMs = parsePositiveInt(
      process.env.UPLOADS_SCAN_TIMEOUT_MS,
      3000,
    );

    try {
      await postBuffer(scanUrl, file.buffer, timeoutMs);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Upload scan failed';
      throw new ServiceUnavailableException(message);
    }
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function postBuffer(
  urlString: string,
  body: Buffer,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let target: URL;
    try {
      target = new URL(urlString);
    } catch {
      reject(new Error('UPLOADS_SCAN_URL inválida'));
      return;
    }

    const isHttps = target.protocol === 'https:';
    if (!isHttps && target.protocol !== 'http:') {
      reject(new Error('UPLOADS_SCAN_URL inválida'));
      return;
    }

    const requestFn = isHttps ? httpsRequest : httpRequest;
    const req = requestFn(
      {
        method: 'POST',
        hostname: target.hostname,
        port: target.port || (isHttps ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': body.length,
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        res.resume();
        if (status < 200 || status >= 300) {
          reject(new Error(`Upload scan falhou (${status})`));
          return;
        }
        resolve();
      },
    );

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Upload scan timeout'));
    });
    req.write(body);
    req.end();
  });
}
