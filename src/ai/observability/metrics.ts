import { register, Counter, Histogram, Gauge } from 'prom-client';

export const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total AI requests by provider and model',
  labelNames: ['provider', 'model', 'status', 'category'],
});

export const aiRequestLatency = new Histogram({
  name: 'ai_request_latency_ms',
  help: 'Request latency in milliseconds',
  labelNames: ['model', 'status'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
});

export const aiTokensUsed = new Counter({
  name: 'ai_tokens_used_total',
  help: 'Total tokens consumed',
  labelNames: ['model', 'type'],
});

export const aiCostTotal = new Counter({
  name: 'ai_cost_usd_total',
  help: 'Total cost in USD',
  labelNames: ['model'],
});

export const aiCacheHits = new Counter({
  name: 'ai_cache_hits_total',
  help: 'Cache hit count',
  labelNames: ['category', 'hit'],
});

export const aiFailoverEvents = new Counter({
  name: 'ai_fallover_events_total',
  help: 'Number of fallover events',
  labelNames: ['from_provider', 'to_provider', 'success'],
});

export const aiProviderAvailability = new Gauge({
  name: 'ai_provider_availability',
  help: 'Provider availability percentage',
  labelNames: ['provider'],
});

export function recordRequest(
  provider: string,
  model: string,
  status: 'success' | 'failure',
  category: string
): void {
  aiRequestsTotal.inc({ provider, model, status, category });
}

export function recordLatency(latency: number, model: string, status: string): void {
  aiRequestLatency.observe({ model, status }, latency);
}

export function recordTokens(tokens: number, model: string, type: 'hit' | 'miss'): void {
  aiTokensUsed.inc({ model, type }, tokens);
}

export function recordCost(cost: number, model: string): void {
  aiCostTotal.inc({ model }, cost);
}

export function recordCacheHit(category: string, hit: boolean): void {
  aiCacheHits.inc({ category, hit: hit ? 'true' : 'false' });
}

export function recordFailover(
  fromProvider: string,
  toProvider: string,
  success: boolean
): void {
  aiFailoverEvents.inc({
    from_provider: fromProvider,
    to_provider: toProvider,
    success: success ? 'true' : 'false',
  });
}

export function setProviderAvailability(provider: string, availability: number): void {
  aiProviderAvailability.set({ provider }, availability);
}

export function getMetrics(): Promise<string> {
  return register.metrics();
}
