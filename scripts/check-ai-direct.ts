import { googleAI } from '@genkit-ai/google-genai';
import { openAICompatible } from '@genkit-ai/compat-oai';
import { genkit } from 'genkit';
import { config } from 'dotenv';

config();

const googleApiKey = process.env.GEMINI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

async function testProvider(name: string, model: string, apiKey: string | undefined, baseURL?: string) {
  console.log(`\nTesting ${name} (${model})...`);
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.log(`⚠️  ${name} API key is MISSING.`);
    return false;
  }

  try {
    const plugins = [];
    if (name === 'Google') {
      plugins.push(googleAI({ apiKey }));
    } else {
      plugins.push(openAICompatible({ name: name.toLowerCase(), apiKey, baseURL }));
    }

    const ai = genkit({ plugins });
    const response = await ai.generate({
      model: name === 'Google' ? `googleai/${model}` : `${name.toLowerCase()}/${model}`,
      prompt: 'Respond with "OK"',
      config: { temperature: 0 }
    });

    if (response.text.toLowerCase().includes('ok')) {
      console.log(`✅ ${name} is WORKING.`);
      return true;
    } else {
      console.log(`⚠️  ${name} responded but with unexpected content: ${response.text}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ ${name} FAILED:`, error instanceof Error ? error.message : error);
    return false;
  }
}

async function runTests() {
  console.log("=== AI Provider Direct Check ===");
  
  const results = {
    google: await testProvider('Google', 'gemini-flash-latest', googleApiKey),
    groq: await testProvider('Groq', 'llama-3.1-8b-instant', groqApiKey, 'https://api.groq.com/openai/v1'),
    openrouter: await testProvider('OpenRouter', 'openrouter/free', openRouterApiKey, 'https://openrouter.ai/api/v1'),
  };

  console.log("\n=== Final Report ===");
  console.log(`Primary (Google): ${results.google ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Fallback 1 (Groq): ${results.groq ? '✅ CONFIGURED' : '❌ NOT CONFIGURED/FAILED'}`);
  console.log(`Fallback 2 (OpenRouter): ${results.openrouter ? '✅ CONFIGURED' : '❌ NOT CONFIGURED/FAILED'}`);

  if (results.google && (results.groq || results.openrouter)) {
    console.log("\n✅ AI Model System is FULLY functional with fallbacks.");
  } else if (results.google) {
    console.log("\n⚠️  AI Model System is working but NO REDUNDANCY available (Missing keys).");
  } else {
    console.log("\n❌ AI Model System is DOWN.");
  }
}

runTests().catch(console.error);
