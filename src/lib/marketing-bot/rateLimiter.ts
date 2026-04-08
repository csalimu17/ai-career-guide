const buckets = new Map<string, { count: number; resetAt: number }>();

function getWindowMs() {
  return Number(process.env.BOT_RATE_LIMIT_WINDOW_MS || 60_000);
}

function getMax() {
  return Number(process.env.BOT_RATE_LIMIT_MAX || 25);
}

export function checkRateLimit(key: string) {
  const now = Date.now();
  const windowMs = getWindowMs();
  const max = getMax();
  const bucketKey = String(key || "unknown");
  const current = buckets.get(bucketKey);

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
