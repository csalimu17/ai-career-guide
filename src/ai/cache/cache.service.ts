import pino from 'pino';
import crypto from 'crypto';
import type { Redis } from '@upstash/redis';
import { getRedis } from '@/lib/server/upstash';

const logger = pino();

export interface CachedResponse {
  id: string;
  response: any;
  model: string;
  tokens: number;
  cost: number;
  timestamp: number;
  version: number;
}

export class CacheService {
  private redis: Redis | null;
  private readonly defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = getRedis();
  }

  async get(key: string): Promise<CachedResponse | null> {
    if (!this.redis) return null;

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        logger.debug({ msg: '[Cache Hit]', key });
        // @upstash/redis might return an object directly or a JSON string depending on configuration
        return typeof cached === 'string' ? JSON.parse(cached) : (cached as CachedResponse);
      }
      return null;
    } catch (error) {
      logger.error({ msg: '[Cache Get Error]', key, error });
      return null;
    }
  }

  async set(
    key: string,
    response: any,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const cached: CachedResponse = {
        id: key,
        response: response.text || response,
        model: response.model || 'unknown',
        tokens: response.tokensUsed || 0,
        cost: response.estimatedCost || 0,
        timestamp: Date.now(),
        version: 1,
      };

      await this.redis.setex(
        key,
        ttl,
        JSON.stringify(cached)
      );

      logger.debug({ msg: '[Cache Set]', key, ttl });
    } catch (error) {
      logger.error({ msg: '[Cache Set Error]', key, error });
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);
      logger.debug({ msg: '[Cache Delete]', key });
    } catch (error) {
      logger.error({ msg: '[Cache Delete Error]', key, error });
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug({ msg: '[Cache Delete Pattern]', pattern, count: keys.length });
      }
    } catch (error) {
      logger.error({ msg: '[Cache Delete Pattern Error]', pattern, error });
    }
  }

  generateKey(
    prompt: string,
    model: string,
    category: string,
    contextHash?: string
  ): string {
    const normalized = prompt.toLowerCase().trim();
    const components = [normalized, model, category, contextHash || '0'];
    const hash = crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
      .slice(0, 16);

    return `cache:${hash}`;
  }
}
