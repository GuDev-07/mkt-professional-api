import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.SUPABASE_S3_ENDPOINT;
    const region = process.env.SUPABASE_S3_REGION;
    const accessKeyId =
      process.env.SUPABASE_S3_ACCESS_KEY_ID ??
      process.env.SUPABASE_S3_ACCESS_KEY;
    const secretAccessKey =
      process.env.SUPABASE_S3_SECRET_ACCESS_KEY ??
      process.env.SUPABASE_S3_SECRET;
    const bucket = process.env.SUPABASE_BUCKET;

    const missing: string[] = [];
    if (!endpoint) missing.push('SUPABASE_S3_ENDPOINT');
    if (!region) missing.push('SUPABASE_S3_REGION');
    if (!accessKeyId)
      missing.push('SUPABASE_S3_ACCESS_KEY_ID or SUPABASE_S3_ACCESS_KEY');
    if (!secretAccessKey)
      missing.push('SUPABASE_S3_SECRET_ACCESS_KEY or SUPABASE_S3_SECRET');
    if (!bucket) missing.push('SUPABASE_BUCKET');

    if (missing.length) {
      throw new Error(
        `Missing Supabase S3 configuration: ${missing.join(', ')}`,
      );
    }

    const allowInsecure = process.env.SUPABASE_S3_ALLOW_INSECURE === 'true';
    if (!allowInsecure) {
      try {
        const parsed = new URL(endpoint!);
        if (parsed.protocol !== 'https:') {
          throw new Error('SUPABASE_S3_ENDPOINT must use https');
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Invalid SUPABASE_S3_ENDPOINT');
      }
    }

    this.bucket = bucket!;
    this.client = new S3Client({
      region: region!,
      endpoint: endpoint!,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
      forcePathStyle: true,
    });
  }

  async uploadObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await this.client.send(command);
  }

  async getObject(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return this.client.send(command);
  }
}
