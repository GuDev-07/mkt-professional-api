export interface UploadImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

/** Type guard — narrows `file: unknown` to `UploadImageFile` (multer memory storage shape). */
export function isUploadImageFile(file: unknown): file is UploadImageFile {
  if (!file || typeof file !== 'object') return false;
  const candidate = file as UploadImageFile;
  return (
    typeof candidate.originalname === 'string' &&
    typeof candidate.mimetype === 'string' &&
    Buffer.isBuffer(candidate.buffer)
  );
}

export function detectImageMimeType(buffer: Buffer): string | null {
  if (buffer.length < 8) return null;

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) return 'image/jpeg';

  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  if (isPng) return 'image/png';

  return null;
}
