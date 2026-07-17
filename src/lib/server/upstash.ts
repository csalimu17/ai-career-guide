import { Redis } from "@upstash/redis";

let redis: Redis | null | undefined;

export function getRedis() {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    redis = null;
    return redis;
  }

  redis = new Redis({ url, token });
  return redis;
}
