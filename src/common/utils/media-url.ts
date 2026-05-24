import { createHmac, timingSafeEqual } from 'crypto';

export const isExternalUrl = (value: string): boolean =>
  /^https?:\/\//i.test(value);

const getNormalizedBasePath = (): string => {
  const basePath = process.env.BASE_PATH ?? '';
  return basePath ? `/${basePath.replace(/^\/+|\/+$/g, '')}` : '';
};

const getMediaSigningSecret = (): string | null =>
  process.env.MEDIA_SIGNING_SECRET ?? null;

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getMediaSigningTtl = (): number =>
  parsePositiveInt(process.env.MEDIA_SIGNING_TTL_SECONDS, 3600);

const buildMediaSignature = (
  key: string,
  expires: number,
  secret: string,
): string => {
  return createHmac('sha256', secret)
    .update(`${key}:${expires}`)
    .digest('base64url');
};

export const isMediaSigningEnabled = (): boolean =>
  Boolean(getMediaSigningSecret());

export const verifyMediaSignature = (
  key: string,
  expires: number,
  token: string,
): boolean => {
  const secret = getMediaSigningSecret();
  if (!secret) {
    return true;
  }

  const expected = buildMediaSignature(key, expires, secret);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(token);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
};

export const buildProxyUrl = (key: string): string => {
  const normalizedBase = getNormalizedBasePath();
  const encodedKey = encodeURIComponent(key);
  const secret = getMediaSigningSecret();

  if (!secret) {
    return `${normalizedBase}/media/${encodedKey}`;
  }

  const expires = Math.floor(Date.now() / 1000) + getMediaSigningTtl();
  const token = buildMediaSignature(key, expires, secret);
  const query = new URLSearchParams({
    expires: String(expires),
    token,
  });

  return `${normalizedBase}/media/${encodedKey}?${query.toString()}`;
};
