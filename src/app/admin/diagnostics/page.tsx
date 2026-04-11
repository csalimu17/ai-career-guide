'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, CheckCircle2, XCircle, AlertTriangle, Activity, ShieldCheck, Wrench, RefreshCw } from 'lucide-react';
import { runGovernanceDiagnosticsAndRepair, type GovernanceDiagnosticsResult } from '@/app/actions/admin-diagnostics';
import { firebaseConfig } from '@/firebase/config';
import { useUser } from '@/firebase';
import { fetchAuthedJson } from '@/lib/client/fetch-json';
import { siteConfig } from '@/lib/site';

type QualityMonitorTone = 'healthy' | 'warning' | 'critical';

type QualityMonitorSnapshot = {
  generatedAt: string;
  overallStatus: QualityMonitorTone;
  checks: Array<{
    id: string;
    title: string;
    status: QualityMonitorTone;
    summary: string;
    metrics: Array<{ label: string; value: string }>;
    autoFixes: string[];
  }>;
  recentSignals: Array<{
    id: string;
    category: string;
    eventType: string;
    status: QualityMonitorTone;
    summary: string;
    createdAt: string | null;
  }>;
};

export default function DiagnosticsPage() {
  const { user, isUserLoading } = useUser();
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [repairSummary, setRepairSummary] = useState<string | null>(null);
  const [serverActionStatus, setServerActionStatus] = useState<'not_tested' | 'working' | 'broken'>('not_tested');
  const [qualitySnapshot, setQualitySnapshot] = useState<QualityMonitorSnapshot | null>(null);
  const [qualityStatus, setQualityStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL || siteConfig.url;
  const badgeClassByTone = {
    success: 'border-green-100 bg-green-50/50 text-green-600',
    warning: 'border-orange-100 bg-orange-50/50 text-orange-600',
    error: 'border-red-100 bg-red-50/50 text-red-600',
  } as const;
  const monitorBadgeClassByTone: Record<QualityMonitorTone, string> = {
    healthy: 'border-green-100 bg-green-50/50 text-green-600',
    warning: 'border-orange-100 bg-orange-50/50 text-orange-600',
    critical: 'border-red-100 bg-red-50/50 text-red-600',
  };
  type RuntimeCheckTone = keyof typeof badgeClassByTone;

  const runtimeChecks: Array<{ name: string; status: string; tone: RuntimeCheckTone }> = [
    {
      name: 'Signed-in session',
      status: user ? 'ACTIVE' : 'MISSING',
      tone: user ? 'success' : 'warning',
    },
    {
      name: 'Firebase web config',
      status: firebaseConfig.projectId && firebaseConfig.apiKey ? 'CONFIGURED' : 'MISSING',
      tone: firebaseConfig.projectId && firebaseConfig.apiKey ? 'success' : 'error',
    },
    {
      name: 'Public app URL',
      status: publicAppUrl ? 'SET' : 'MISSING',
      tone: publicAppUrl ? 'success' : 'warning',
    },
    {
      name: 'Server action layer',
      status:
        serverActionStatus === 'working'
          ? 'CONNECTED'
          : serverActionStatus === 'broken'
          ? 'FAILED'
          : 'WAITING',
      tone:
        serverActionStatus === 'working'
          ? 'success'
          : serverActionStatus === 'broken'
          ? 'error'
          : 'warning',
    },
    {
      name: 'AI runtime handshake',
      status:
        aiStatus === 'success'
          ? 'OPERATIONAL'
          : aiStatus === 'error'
          ? 'FAILED'
          : aiStatus === 'loading'
          ? 'TESTING'
          : 'NOT TESTED',
      tone:
        aiStatus === 'success'
          ? 'success'
          : aiStatus === 'error'
          ? 'error'
          : 'warning',
    },
  ];

  const applyDiagnosticsResult = (result: GovernanceDiagnosticsResult) => {
    setServerActionStatus(result.serverAction);
    setRepairSummary(result.ai.repairSummary);
    setActiveModel(result.ai.activeModel ?? result.ai.configuredModel);

    if (result.qualitySnapshot) {
      setQualitySnapshot(result.qualitySnapshot as QualityMonitorSnapshot);
      setQualityStatus('ready');
    }

    if (result.ai.status === 'error') {
      setAiStatus('error');
      setAiResponse(null);
      setErrorDetails(result.ai.error);
      return;
    }

    setAiStatus('success');
    setAiResponse(result.ai.response);
    setErrorDetails(result.ai.error);
  };

  const runAiTest = async () => {
    setAiStatus('loading');
    setAiResponse(null);
    setErrorDetails(null);
    setRepairSummary(null);
    setActiveModel(null);
    setServerActionStatus('not_tested');

    try {
      const result = await runGovernanceDiagnosticsAndRepair();
      applyDiagnosticsResult(result);
    } catch (error: any) {
      console.error('AI Test failed:', error);
      setAiStatus('error');
      setErrorDetails(error.message || 'Unknown error');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadQualitySnapshot = async () => {
      if (!user) return;

      try {
        const payload = await fetchAuthedJson<{ ok: boolean; snapshot?: QualityMonitorSnapshot }>(
          user,
          '/api/diagnostics/quality-engineer',
          { cache: 'no-store' }
        );

        if (cancelled) return;

        if (payload?.ok && payload.snapshot) {
          setQualitySnapshot(payload.snapshot as QualityMonitorSnapshot);
          setQualityStatus('ready');
        } else {
          setQualityStatus('error');
        }
      } catch (error) {
        console.error('Failed to load quality engineer snapshot:', error);
        if (!cancelled) {
          setQualityStatus('error');
        }
      }
    };

    if (isUserLoading || !user) {
      return;
    }

    void loadQualitySnapshot();
    const interval = window.setInterval(() => {
      void loadQualitySnapshot();
    }, 45000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isUserLoading, user]);

  return (
    <div className="space-y-5 md:space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase sm:text-3xl">System Diagnostics</h1>
        <p className="text-slate-500 font-medium text-sm mt-1">Verify core infrastructure and AI service connectivity.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        <Card className="overflow-hidden rounded-[1.5rem] border-none shadow-sm md:col-span-2 sm:rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Built-in Quality Engineer
            </CardTitle>
            <CardDescription>Always-on monitoring for CV upload, parsing recovery, editor export, and print quality.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={qualitySnapshot ? monitorBadgeClassByTone[qualitySnapshot.overallStatus] : badgeClassByTone.warning}>
                {qualityStatus === 'loading' ? 'LOADING' : qualityStatus === 'error' ? 'UNAVAILABLE' : qualitySnapshot?.overallStatus.toUpperCase()}
              </Badge>
              <span className="text-xs font-medium text-slate-500">
                {qualitySnapshot?.generatedAt ? `Last updated ${new Date(qualitySnapshot.generatedAt).toLocaleString()}` : 'Fetching latest runtime quality snapshot.'}
              </span>
            </div>

            {qualityStatus === 'loading' ? (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading quality monitor data...
              </div>
            ) : qualityStatus === 'error' || !qualitySnapshot ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
                The quality engineer monitor is not responding right now. Runtime safeguards still stay active, but the dashboard could not load current health data.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  {qualitySnapshot.checks.map((check) => (
                    <div key={check.id} className="space-y-4 rounded-[1.35rem] border border-slate-100 bg-slate-50/70 p-4 sm:rounded-[1.5rem] sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">{check.title}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-slate-500">{check.summary}</p>
                        </div>
                        <Badge variant="outline" className={monitorBadgeClassByTone[check.status]}>
                          {check.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {check.metrics.map((metric) => (
                          <div key={`${check.id}-${metric.label}`} className="flex items-center justify-between text-xs">
                            <span className="font-semibold uppercase tracking-wider text-slate-400">{metric.label}</span>
                            <span className="font-black text-slate-700">{metric.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {check.autoFixes.map((fix) => (
                          <div key={`${check.id}-${fix}`} className="flex items-start gap-2 text-xs text-slate-600">
                            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                            <span>{fix}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Signals</div>
                  <div className="space-y-3">
                    {qualitySnapshot.recentSignals.length ? qualitySnapshot.recentSignals.map((signal) => (
                      <div key={signal.id} className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={monitorBadgeClassByTone[signal.status]}>
                              {signal.status.toUpperCase()}
                            </Badge>
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                              {signal.category} - {signal.eventType}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-700">{signal.summary}</p>
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                          {signal.createdAt ? new Date(signal.createdAt).toLocaleString() : 'Pending timestamp'}
                        </span>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
                        No live quality signals yet. The monitor will populate automatically as upload, extraction, editor export, and print flows run.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[1.5rem] border-none shadow-sm sm:rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Genkit AI Connectivity
            </CardTitle>
            <CardDescription>Test the connection to the configured Gemini runtime used by the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Runtime</span>
                <span className="text-sm font-bold text-slate-700 italic">{activeModel || 'Configured model from current server runtime'}</span>
              </div>
              <Badge variant={aiStatus === 'success' ? 'default' : aiStatus === 'error' ? 'destructive' : 'secondary'} className="rounded-md uppercase text-[10px] font-black">
                {aiStatus === 'idle' && 'Not Tested'}
                {aiStatus === 'loading' && 'Testing...'}
                {aiStatus === 'success' && 'Operational'}
                {aiStatus === 'error' && 'Failed'}
              </Badge>
            </div>

            {aiResponse && (
              <div className="p-4 bg-green-50 text-green-800 rounded-2xl border border-green-100 text-sm font-medium">
                <div className="flex items-center gap-2 mb-2 font-black text-[10px] uppercase">
                  <CheckCircle2 className="h-3 w-3" /> Response Received
                </div>
                "{aiResponse}"
              </div>
            )}

            {repairSummary && (
              <div className="p-4 bg-amber-50 text-amber-900 rounded-2xl border border-amber-100 text-sm font-medium">
                <div className="flex items-center gap-2 mb-2 font-black text-[10px] uppercase">
                  <Wrench className="h-3 w-3" /> Auto Repair Applied
                </div>
                {repairSummary}
              </div>
            )}

            {errorDetails && (
              <div className="p-4 bg-red-50 text-red-800 rounded-2xl border border-red-100 text-xs font-mono">
                <div className="flex items-center gap-2 mb-2 font-black text-[10px] uppercase">
                  <XCircle className="h-3 w-3" /> Error Stack
                </div>
                {errorDetails}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Button 
                onClick={runAiTest} 
                disabled={aiStatus === 'loading'}
                className="h-12 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/10"
              >
                {aiStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wrench className="h-4 w-4 mr-2" />}
                Diagnose & Auto Repair
              </Button>
              <Button 
                onClick={runAiTest}
                disabled={aiStatus === 'loading'}
                variant="outline"
                className="h-12 rounded-2xl font-black uppercase text-xs tracking-widest"
              >
                {aiStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Re-run Checks
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[1.5rem] border-none shadow-sm sm:rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Runtime Checks
            </CardTitle>
            <CardDescription>Show only the signals this screen can actually verify at runtime.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-3">
                {runtimeChecks.map((check) => (
                  <div key={check.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500">{check.name}</span>
                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter ${badgeClassByTone[check.tone]}`}>
                      {check.status}
                    </Badge>
                  </div>
                ))}
             </div>
             <p className="text-[10px] italic text-slate-400 font-medium">
               Server-only secrets stay redacted. The AI handshake and server-action check are the real proof that runtime configuration is healthy.
             </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
