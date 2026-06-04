
const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const googleApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

const ai = genkit({
  plugins: [googleAI({ apiKey: googleApiKey })]
});

async function list() {
  console.log('--- REGISTERED MODELS ---');
  const models = await ai.registry.listActions();
  const modelActions = models.filter(a => a.actionType === 'model');
  modelActions.forEach(a => console.log(a.name));
  console.log('-------------------------');
}

list().catch(console.error);
