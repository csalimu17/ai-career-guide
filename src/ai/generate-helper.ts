import { GenerateOptions } from 'genkit';
import { generateWithOrchestration } from './orchestrator';
import { RequestCoordinationContext } from './orchestrator/request-coordinator';

function buildJsonInstruction(schema: any): string {
  try {
    const fields = schema?.shape ? Object.keys(schema.shape) : [];
    const hint = fields.length
      ? `a JSON object with field(s): ${fields.map((f: string) => `"${f}"`).join(', ')}`
      : 'a JSON object';
    return `\n\nRESPONSE FORMAT: Respond ONLY with valid JSON — no markdown fences, no explanation, no text outside the JSON. Return ${hint}.`;
  } catch {
    return '\n\nRESPONSE FORMAT: Respond ONLY with valid JSON. No markdown, no extra text.';
  }
}

function parseJsonResponse(text: string): any {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

export async function generateWithFallback(
  options: GenerateOptions,
  context?: Partial<RequestCoordinationContext>
) {
  const outputSchema = (options as any).output?.schema;
  let modifiedOptions = options;

  if (outputSchema) {
    const jsonInstruction = buildJsonInstruction(outputSchema);
    modifiedOptions = {
      ...options,
      system: options.system
        ? `${options.system as string}${jsonInstruction}`
        : jsonInstruction,
    };
  }

  const response = await generateWithOrchestration(modifiedOptions, context);

  let output: any = response.text;

  if (outputSchema) {
    try {
      output = parseJsonResponse(response.text);
    } catch {
      // Leave output as raw text — caller handles undefined fields gracefully
    }
  }

  return {
    text: response.text,
    output,
    provider: response.provider,
    model: response.model,
    latency: response.latency,
    tokens: response.tokensUsed,
    cost: response.cost,
    cacheHit: response.cacheHit,
  } as any;
}
