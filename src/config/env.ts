const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_S3_ENDPOINT',
  'SUPABASE_S3_REGION',
  'SUPABASE_BUCKET',
] as const;

const REQUIRED_ONE_OF: [string, string][] = [
  ['SUPABASE_S3_ACCESS_KEY_ID', 'SUPABASE_S3_ACCESS_KEY'],
  ['SUPABASE_S3_SECRET_ACCESS_KEY', 'SUPABASE_S3_SECRET'],
];

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  for (const [primary, fallback] of REQUIRED_ONE_OF) {
    if (!process.env[primary] && !process.env[fallback]) {
      missing.push(`${primary} or ${fallback}`);
    }
  }

  if (missing.length > 0) {
    const list = missing.map((k) => `  - ${k}`).join('\n');
    throw new Error(
      `[bootstrap] Missing required environment variables:\n${list}\n\nPlease set them in your .env file before starting the application.`,
    );
  }
}
