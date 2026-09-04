export function pick(obj: any, snake: string, camel: string) {
  return obj?.[snake] !== undefined ? obj[snake] : obj?.[camel];
}

export function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string' && value.length) return BigInt(value);
  return 0n;
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string' && value.length) return Number(value);
  return 0;
}

export function toStr(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}
