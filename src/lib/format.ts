/**
 * Formatting helpers. GenVM returns sized integers (u32/u256) across the
 * calldata boundary in ways that can surface as `number`, `string`, or
 * `bigint` depending on the SDK version and RPC path - these helpers accept
 * all three defensively rather than assuming one shape.
 */

const WEI_PER_GEN = 1_000_000_000_000_000_000n;

export function toBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  if (typeof value === "string" && value.trim().length > 0) {
    try {
      return BigInt(value.trim());
    } catch {
      return 0n;
    }
  }
  return 0n;
}

export function weiToGen(value: unknown, fractionDigits = 4): string {
  const wei = toBigInt(value);
  const whole = wei / WEI_PER_GEN;
  const remainder = wei % WEI_PER_GEN;
  if (fractionDigits <= 0) return whole.toString();

  const fractionStr = remainder.toString().padStart(18, "0").slice(0, fractionDigits);
  const trimmed = fractionStr.replace(/0+$/, "");
  return trimmed.length > 0 ? `${whole}.${trimmed}` : whole.toString();
}

export function genToWei(value: string | number): bigint {
  const raw = String(value).trim();
  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [wholeRaw, fracRaw = ""] = unsigned.split(".");
  const whole = wholeRaw.length > 0 ? BigInt(wholeRaw) : 0n;
  const frac = (fracRaw + "0".repeat(18)).slice(0, 18);
  const magnitude = whole * WEI_PER_GEN + BigInt(frac || "0");
  return negative ? -magnitude : magnitude;
}

export function shortAddress(address?: string | null): string {
  if (!address) return "—";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function toText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}
