export const normalizeEnumValue = <T extends Record<string, string>>(
  value: unknown,
  enumValues: T,
): T[keyof T] | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const values = Object.values(enumValues);
  if (values.includes(trimmed as T[keyof T])) {
    return trimmed as T[keyof T];
  }

  const normalized = trimmed
    .replace(/[’']/g, '')
    .replace(/&/g, ' ')
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (values.includes(normalized as T[keyof T])) {
    return normalized as T[keyof T];
  }

  return undefined;
};
