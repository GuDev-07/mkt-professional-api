import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { extname } from 'path';
import { buildProxyUrl } from '../../common/utils/media-url';
import { S3StorageService } from './s3-storage.service';

@Injectable()
export class UploadsService {
  constructor(private readonly storage: S3StorageService) {}

  buildKey(originalName: string, mimeType: string): string {
    const prefix = (process.env.SUPABASE_UPLOAD_PREFIX ?? 'projects/').replace(
      /^\/+/, // strip leading slashes
      '',
    );
    const ext = extname(originalName) || this.fallbackExtension(mimeType);
    return `${prefix}${Date.now()}_${randomUUID()}${ext}`;
  }

  async uploadImage(
    file: UploadImageFile,
  ): Promise<{ key: string; url: string }> {
    await this.scanIfConfigured(file);
    const key = this.buildKey(file.originalname, file.mimetype);
    await this.storage.uploadObject(key, file.buffer, file.mimetype);

    return { key, url: buildProxyUrl(key) };
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

export interface UploadImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
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
