
import { getAi } from '../src/ai/genkit';

async function listModels() {
  try {
    // There isn't a direct 'listModels' in Genkit's high level API easily accessible here
    // but we can try to generate with a few common names and see which one doesn't 404.
    const names = [
      'googleai/gemini-1.5-flash',
      'googleai/gemini-pro',
      'googleai/gemini-1.5-pro'
    ];
    
    for (const name of names) {
      try {
        console.log(`Testing ${name}...`);
        const result = await getAi().generate({
          model: name,
          prompt: 'hi'
        });
        console.log(`✅ ${name} works!`);
        return;
      } catch (e: any) {
        console.log(`❌ ${name} failed: ${e.message}`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

listModels();
