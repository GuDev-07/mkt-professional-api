import { TransformFnParams } from 'class-transformer';

export function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

export function pickStringFromTransform(...keys: string[]) {
  return ({ value, obj }: TransformFnParams): string | undefined => {
    const source = obj as Record<string, unknown>;
    return pickString(value, ...keys.map((key) => source[key]));
  };
}

export function normalizeFeedbackFields(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const jobTitle = pickString(raw.jobTitle, raw.job_title);
  const avatarUrl = pickString(raw.avatarUrl, raw.avatar_url);

  return {
    ...raw,
    ...(jobTitle !== undefined && { jobTitle }),
    ...(avatarUrl !== undefined && { avatarUrl }),
  };
}
