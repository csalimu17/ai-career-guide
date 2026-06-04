import { GenerateOptions } from 'genkit';
import { RequestCoordinator, RequestCoordinationContext } from './request-coordinator';
import { GeminiStrategy } from '../providers/gemini.strategy';
import { GroqStrategy } from '../providers/groq.strategy';
import { OpenRouterStrategy } from '../providers/openrouter.strategy';
import { OllamaStrategy } from '../providers/ollama.strategy';
import { AIProviderStrategy, AIProviderResponse } from '../providers/base.strategy';
import { CacheService } from '../cache/cache.service';
import { UsageManager } from './usage-manager';
import { identifyGoldenPrompt, getCacheTTL } from '../cache/golden-prompts';
import { 
  recordRequest, 
  recordLatency, 
  recordTokens, 
  recordCost,
  recordCacheHit, 
  recordFailover 
} from '../observability/metrics';
import { v4 as uuidv4 } from 'uuid';

let coordinator: RequestCoordinator | null = null;
let cacheService: CacheService | null = null;
let usageManager: UsageManager | null = null;

function getCoordinator() {
  if (!coordinator) {
    const strategies = new Map<string, AIProviderStrategy>();
    strategies.set('gemini', new GeminiStrategy());
    strategies.set('groq', new GroqStrategy());
    strategies.set('openrouter', new OpenRouterStrategy());
    strategies.set('ollama', new OllamaStrategy());
    
    coordinator = new RequestCoordinator(strategies);
  }
  return coordinator;
}

function getCache() {
  if (!cacheService) {
    cacheService = new CacheService();
  }
  return cacheService;
}

function getUsage() {
  if (!usageManager) {
    usageManager = new UsageManager();
  }
  return usageManager;
}

export function overrideUsageManager(manager: UsageManager) {
  usageManager = manager;
}

export async function generateWithOrchestration(
  options: GenerateOptions,
  context?: Partial<RequestCoordinationContext>
): Promise<AIProviderResponse> {
  const startTime = Date.now();
  const requestId = context?.requestId || uuidv4();
  const category = (context?.category as string) || 'default';
  const userId = context?.userId || 'anonymous';
  const userTier = context?.userTier || 'free';

  // 1. Quota Check
  if (userId !== 'anonymous') {
    const quota = await getUsage().checkQuota(userId, userTier);
    if (!quota.allowed) {
      // If quota hit, we could potentially force-failover to Ollama (Tier-4)
      // but for now we follow the user's request to enforce guardrails.
      throw new Error(quota.reason);
    }
  }

  const fullContext: RequestCoordinationContext = {
    requestId,
    timestamp: startTime,
    priority: context?.priority || 'normal',
    userId,
    userTier,
    category,
    retryCount: 0,
    attemptedProviders: [],
  };

  const cache = getCache();
  const cacheKey = cache.generateKey(
    options.prompt as string,
    options.model as string || 'default',
    category
  );

  // 2. Try Cache
  if (process.env.ENABLE_CACHE === 'true') {
    const cached = await cache.get(cacheKey);
    if (cached) {
      recordCacheHit(category, true);
      return {
        text: cached.response,
        model: cached.model,
        provider: 'cache',
        tokensUsed: cached.tokens,
        cost: cached.cost,
        cacheHit: true,
        latency: Date.now() - startTime,
      };
    }
  }

  // 3. Execute with Orchestrator
  try {
    const response = await getCoordinator().execute(options, fullContext);
    
    // 4. Record Metrics
    const duration = Date.now() - startTime;
    recordRequest(response.provider, response.model, 'success', category);
    recordLatency(duration, response.model, 'success');
    recordTokens(response.tokensUsed, response.model, 'miss');
    recordCost(response.cost, response.model);
    
    if (fullContext.attemptedProviders.length > 1) {
      recordFailover(
        fullContext.attemptedProviders[0],
        response.provider,
        true
      );
    }

    // 5. Update Usage
    if (userId !== 'anonymous') {
      await getUsage().recordUsage(userId, response.cost, response.tokensUsed);
    }

    // 6. Update Cache
    if (process.env.ENABLE_CACHE === 'true') {
      const isGolden = identifyGoldenPrompt(options.prompt as string, category);
      const ttl = getCacheTTL(category, isGolden);
      await cache.set(cacheKey, response, ttl);
    }

    return response;
  } catch (error: any) {
    recordRequest('unknown', 'unknown', 'failure', category);
    throw error;
  }
}

export async function getOrchestratorStatus() {
  return {
    coordinator: getCoordinator().getHealthStatuses(),
    timestamp: Date.now(),
  };
}
