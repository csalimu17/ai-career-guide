import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

/**
 * SECURITY: This endpoint mutates shared Redis state used by production AI
 * traffic (toggling provider failures). It must never be reachable in a
 * production deployment. Block before any handler logic runs.
 */
function blockInProduction() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}

/**
 * GET /api/test/simulate-failure
 * Retrieves the current failure simulation state for providers.
 */
export async function GET() {
  const blocked = blockInProduction();
  if (blocked) return blocked;

  try {
    const states = await redis.hgetall('test:provider_failures');
    return NextResponse.json({ states: states || {} });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/test/simulate-failure
 * Toggles a failure simulation for a specific provider.
 * Body: { provider: string, enabled: boolean }
 */
export async function POST(req: Request) {
  const blocked = blockInProduction();
  if (blocked) return blocked;

  try {
    const { provider, enabled } = await req.json();
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    if (enabled) {
      await redis.hset('test:provider_failures', { [provider]: 'true' });
    } else {
      await redis.hdel('test:provider_failures', provider);
    }

    return NextResponse.json({ success: true, provider, enabled });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
