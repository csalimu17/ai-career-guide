import { register } from 'prom-client';
import { NextResponse } from 'next/server';
import { getOrchestratorStatus } from '@/ai/orchestrator';
import { requireActiveAdmin } from '@/lib/server/route-auth';

export async function GET(request: Request) {
  // SECURITY: This endpoint exposes internal model spend and orchestrator
  // status. Previously unauthenticated and reachable from the public
  // internet. Now requires an active admin Firebase session.
  const authResult = await requireActiveAdmin(request);
  if (!authResult.ok) return authResult.response;

  try {
    const metrics = await register.getMetricsAsJSON();
    const orchestratorStatus = await getOrchestratorStatus();
    
    // Process metrics to extract model-level stats
    const modelStats: Record<string, any> = {};
    
    metrics.forEach((metric: any) => {
      if (metric.name === 'ai_tokens_total' || metric.name === 'ai_cost_usd_total') {
        metric.values.forEach((v: any) => {
          const model = v.labels.model;
          if (!modelStats[model]) modelStats[model] = { tokens: 0, cost: 0 };
          
          if (metric.name === 'ai_tokens_total') modelStats[model].tokens += v.value;
          if (metric.name === 'ai_cost_usd_total') modelStats[model].cost += v.value;
        });
      }
    });

    const stats = {
      health: orchestratorStatus.coordinator,
      models: modelStats,
      rawMetrics: metrics,
      timestamp: Date.now(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
