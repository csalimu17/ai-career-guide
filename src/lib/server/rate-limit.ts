type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS_BEFORE_PRUNE = 5_000;

function positiveNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export function rateLimit(
  key: string,
  options: Partial<RateLimitOptions> = {},
): RateLimitResult {
  const now = Date.now();
  const windowMs = positiveNumber(options.windowMs, 60_000);
  const max = positiveNumber(options.max, 60);
  const bucketKey = key || "unknown";
  const current = buckets.get(bucketKey);

  if (buckets.size > MAX_BUCKETS_BEFORE_PRUNE) {
    for (const [storedKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(storedKey);
    }
  }

  if (!current || current.resetAt <= now) {
    const next = {
      count: 1,
      resetAt: now + windowMs,
    };
    buckets.set(bucketKey, next);
    return {
      allowed: true,
      remaining: Math.max(max - 1, 0),
      resetAt: next.resetAt,
    };
  }

  if (current.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(max - current.count, 0),
    resetAt: current.resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
  };
}
