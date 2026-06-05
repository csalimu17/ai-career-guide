import { getAi } from '../src/ai/genkit';
import { getGeminiModel, getFallbackGeminiModel, CATEGORY_MODEL_MAP } from '../src/ai/model-router';
import { config } from 'dotenv';

// Load environment variables
config();

type ValidationResult = {
  provider: string;
  model: string;
  status: 'healthy' | 'error';
  message: string;
};

async function validateProvider(model: string): Promise<ValidationResult> {
  try {
    const ai = getAi();
    const response = await ai.generate({
      model,
      config: { temperature: 0 },
      prompt: 'Respond with only: OK',
    });
    
    if (response.text.includes('OK')) {
      return {
        provider: model.split('/')[0],
        model,
        status: 'healthy',
        message: `✅ ${model} responding correctly`,
      };
    }
  } catch (error) {
    return {
      provider: model.split('/')[0],
      model,
      status: 'error',
      message: `❌ ${model}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  
  return {
    provider: model.split('/')[0],
    model,
    status: 'error',
    message: `❌ ${model}: Unexpected response format`,
  };
}

export async function validateAiConfiguration() {
  console.log('\n=== AI Provider Configuration Validation ===\n');
  
  const primaryModel = await getGeminiModel('default');
  const fallbackModel = getFallbackGeminiModel('default');
  
  console.log(`Primary Model: ${primaryModel}`);
  console.log(`Fallback Model: ${fallbackModel || 'NONE (⚠️ NO REDUNDANCY)'}\n`);
  
  const modelsToTest = [
    primaryModel,
    ...(fallbackModel ? [fallbackModel] : []),
    // Add other potential providers to test if they ARE configured but not selected
    ...Object.values(CATEGORY_MODEL_MAP).filter(m => m !== primaryModel && m !== fallbackModel),
  ];
  
  const results: ValidationResult[] = [];
  
  for (const model of modelsToTest) {
    if (!model) continue;
    const result = await validateProvider(model as string);
    results.push(result);
    console.log(result.message);
  }
  
  const healthy = results.filter(r => r.status === 'healthy');
  const failed = results.filter(r => r.status === 'error');
  
  console.log(`\n=== Summary ===`);
  console.log(`Healthy Providers: ${healthy.length}`);
  console.log(`Failed Providers: ${failed.length}`);
  
  if (healthy.length < 2) {
    console.warn('\n⚠️  WARNING: Less than 2 providers operational. Fallback system is limited.');
  } else {
    console.log('\n✅ All providers operational. Fallback system active.');
  }
  return true;
}

// Run
validateAiConfiguration().catch(console.error);
