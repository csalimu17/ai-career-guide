'use server';

import { runAiRuntimeHandshake } from '@/ai/runtime-health';
import { getQualityEngineerSnapshot } from '@/lib/quality-engineer';

export type GovernanceDiagnosticsResult = {
  serverAction: 'working' | 'broken';
  ai: Awaited<ReturnType<typeof runAiRuntimeHandshake>>;
  qualitySnapshot: Awaited<ReturnType<typeof getQualityEngineerSnapshot>> | null;
};

export async function runGovernanceDiagnosticsAndRepair(): Promise<GovernanceDiagnosticsResult> {
  try {
    const [ai, qualitySnapshot] = await Promise.all([
      runAiRuntimeHandshake({ allowRepair: true }),
      getQualityEngineerSnapshot().catch(() => null),
    ]);

    return {
      serverAction: 'working',
      ai,
      qualitySnapshot,
    };
  } catch (error) {
    console.error('[GovernanceDiagnostics] Failed to run diagnostics:', error);

    return {
      serverAction: 'broken',
      ai: {
        status: 'error',
        configuredModel: 'unknown',
        activeModel: null,
        response: null,
        error: error instanceof Error ? error.message : 'Unknown diagnostics failure',
        repaired: false,
        repairSummary: null,
      },
      qualitySnapshot: null,
    };
  }
}
