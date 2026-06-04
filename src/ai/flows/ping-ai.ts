'use server';

import { runAiRuntimeHandshake } from '@/ai/runtime-health';

export async function pingAi(): Promise<string> {
  try {
    // Audit check for environment variables within the Server Action context
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const hasGoogleKey = !!process.env.GOOGLE_GENAI_API_KEY;
    
    if (!hasGeminiKey && !hasGoogleKey) {
      return `ERROR: Environment variables NOT SEEN by the server process. (GEMINI_API_KEY: missing, GOOGLE_GENAI_API_KEY: missing). Make sure to RESTART your next dev process after adding them to .env.`;
    }

    const result = await runAiRuntimeHandshake({ allowRepair: false });
    if (result.status === 'error') {
      return `ERROR: ${result.error || 'Unknown server-side error during AI handshake'}`;
    }

    return result.response || 'System Operational';
  } catch (error: any) {
    console.error('Ping AI Action Error:', error);
    return `ERROR: ${error.message || 'Unknown server-side error during AI handshake'}`;
  }
}
