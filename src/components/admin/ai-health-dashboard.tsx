"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Activity,
  Database,
  AlertTriangle,
  CheckCircle2,
  Server,
  TrendingDown,
  Zap,
  BarChart3
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/firebase"
import { fetchAuthedJson } from "@/lib/client/fetch-json"

interface AIProviderStats {
  name: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  avgLatency: number;
  requestCount: number;
  successRate: number;
  cost: number;
}

export function AIHealthDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<AIProviderStats[]>([
    { name: 'Gemini', status: 'healthy', avgLatency: 450, requestCount: 1250, successRate: 99.8, cost: 1.25 },
    { name: 'Groq', status: 'healthy', avgLatency: 120, requestCount: 450, successRate: 99.2, cost: 0.85 },
    { name: 'OpenRouter', status: 'degraded', avgLatency: 1200, requestCount: 120, successRate: 85.5, cost: 0 },
    { name: 'Ollama', status: 'healthy', avgLatency: 850, requestCount: 50, successRate: 100, cost: 0 },
  ]);

  const [cacheHitRate, setCacheHitRate] = useState(42);
  const [totalCost, setTotalCost] = useState(2.10);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    async function fetchStats() {
      try {
        // SECURITY: /api/admin/ai-stats now requires an active admin session.
        // fetchAuthedJson attaches the Firebase ID token automatically.
        const data = await fetchAuthedJson<unknown>(user, '/api/admin/ai-stats');
        if (cancelled) return;
        // In a real implementation, we would parse the JSON metrics and
        // map them to the state. For now, we just log the live payload.
        console.log('Live AI Stats:', data);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch AI stats:', error);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">AI Orchestration Health</h2>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
            <Activity className="h-3 w-3" />
            Live Monitoring
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((provider) => (
          <Card key={provider.name} className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  provider.status === 'healthy' ? 'bg-green-500' : 
                  provider.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {provider.name}
                </CardTitle>
              </div>
              <Server className="h-3.5 w-3.5 text-slate-400" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-baseline justify-between mb-4">
                <div className="text-xl font-black text-slate-900">{provider.avgLatency}ms</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Latency</div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    <span>Success Rate</span>
                    <span className={provider.successRate > 95 ? 'text-green-600' : 'text-yellow-600'}>
                      {provider.successRate}%
                    </span>
                  </div>
                  <Progress value={provider.successRate} className="h-1" />
                </div>
                
                <div className="flex justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Volume</span>
                    <span className="text-[11px] font-black text-slate-700">{provider.requestCount}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Est. Cost</span>
                    <span className="text-[11px] font-black text-slate-700">${provider.cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="border-none shadow-sm lg:col-span-2 bg-slate-900 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">
              Optimization Metrics
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                    <Database className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cache Hit Rate</p>
                    <p className="text-2xl font-black text-white">{cacheHitRate}%</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Cached Throughput</span>
                    <span className="text-indigo-400">+1.2s Savings</span>
                  </div>
                  <Progress value={cacheHitRate} className="h-2 bg-white/10" />
                </div>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-widest">
                  Optimizing repeated extraction tasks and CV improvement requests.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total AI Expense</p>
                    <p className="text-2xl font-black text-white">${totalCost.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-xl bg-white/5 p-3">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-1">Failovers</p>
                    <p className="text-xs font-black text-white">12 Events</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-white/5 p-3">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-1">Circuit State</p>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-xs font-black text-white uppercase tracking-widest">Closed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="text-xs font-black uppercase tracking-widest text-indigo-200">
              Orchestrator Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <p className="text-[10px] font-black uppercase tracking-widest">Smart Routing Active</p>
              </div>
              <p className="text-[11px] font-bold text-indigo-100 leading-relaxed">
                Gemini-1.5-Flash is handling 92% of load. Groq fallback engaged 3 times in the last hour.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-indigo-200">
                <span>Recent Failovers</span>
                <span>Success</span>
              </div>
              <div className="divide-y divide-white/10">
                <div className="py-2 flex justify-between items-center">
                  <span className="text-[10px] font-bold">Gemini → Groq</span>
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                </div>
                <div className="py-2 flex justify-between items-center">
                  <span className="text-[10px] font-bold">Groq → OpenRouter</span>
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                </div>
                <div className="py-2 flex justify-between items-center">
                  <span className="text-[10px] font-bold">Gemini → Groq</span>
                  <AlertTriangle className="h-3 w-3 text-red-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
