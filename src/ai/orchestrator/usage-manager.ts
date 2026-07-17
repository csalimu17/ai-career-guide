import pino from 'pino';
import type { Redis } from '@upstash/redis';
import { getRedis } from '@/lib/server/upstash';

const logger = pino();

export interface UserUsageQuota {
  dailyCostLimit: number;
  dailyTokenLimit: number;
}

export const DEFAULT_QUOTAS: Record<string, UserUsageQuota> = {
  free: { dailyCostLimit: 0.50, dailyTokenLimit: 50000 },
  pro: { dailyCostLimit: 5.00, dailyTokenLimit: 500000 },
  master: { dailyCostLimit: 25.00, dailyTokenLimit: 2500000 },
  admin: { dailyCostLimit: 100.00, dailyTokenLimit: 10000000 },
};

export class UsageManager {
  private redis: Redis | null;

  constructor(redisOverride?: Redis) {
    this.redis = redisOverride || getRedis();
  }

  private getDayKey(userId: string): string {
    const today = new Date().toISOString().split('T')[0];
    return `usage:${userId}:${today}`;
  }

  async recordUsage(
    userId: string,
    cost: number,
    tokens: number
  ): Promise<void> {
    if (!this.redis) return;

    const key = this.getDayKey(userId);
    try {
      await this.redis.hincrbyfloat(key, 'cost', cost);
      await this.redis.hincrby(key, 'tokens', tokens);
      await this.redis.expire(key, 86400 * 2); // Keep for 2 days
    } catch (error) {
      logger.error({ msg: '[Usage Manager Error]', userId, error });
    }
  }

  async checkQuota(
    userId: string,
    tier: string = 'free'
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (!this.redis) return { allowed: true };

    const key = this.getDayKey(userId);
    const quota = DEFAULT_QUOTAS[tier] || DEFAULT_QUOTAS.free;

    try {
      const usage = await this.redis.hgetall(key);
      if (!usage) return { allowed: true };

      const currentCost = parseFloat((usage.cost as string) || '0');
      const currentTokens = parseInt((usage.tokens as string) || '0');

      if (currentCost >= quota.dailyCostLimit) {
        return { 
          allowed: false, 
          reason: `Daily cost limit reached ($${quota.dailyCostLimit}). Please try again tomorrow or upgrade your plan.` 
        };
      }

      if (currentTokens >= quota.dailyTokenLimit) {
        return { 
          allowed: false, 
          reason: `Daily token limit reached. Please try again tomorrow.` 
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error({ msg: '[Quota Check Error]', userId, error });
      return { allowed: true }; // Fail open to not block users
    }
  }

  async getUsage(userId: string): Promise<{ cost: number; tokens: number }> {
    if (!this.redis) return { cost: 0, tokens: 0 };

    const key = this.getDayKey(userId);
    try {
      const usage = await this.redis.hgetall(key);
      return {
        cost: parseFloat((usage?.cost as string) || '0'),
        tokens: parseInt((usage?.tokens as string) || '0'),
      };
    } catch {
      return { cost: 0, tokens: 0 };
    }
  }
}
