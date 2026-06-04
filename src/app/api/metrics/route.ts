import { getMetrics } from '@/ai/observability/metrics';

// SECURITY: Previously unauthenticated. Prom-client metrics expose internal
// URLs, error rates, model labels, and cost data. Gate behind a static
// bearer token (set METRICS_AUTH_TOKEN in env). If the token is unset, the
// endpoint is closed by default — scrapers can be authorised once the env
// is configured.
function isAuthorised(request: Request) {
  const expected = process.env.METRICS_AUTH_TOKEN;
  if (!expected) return false;

  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return false;

  const token = authHeader.slice('Bearer '.length).trim();
  return token === expected;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const metrics = await getMetrics();
    return new Response(metrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);
    return new Response('Error collecting metrics', { status: 500 });
  }
}
