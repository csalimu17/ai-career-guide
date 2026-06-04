import { config } from 'dotenv';
config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.error('No Gemini API key found.');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Available Models (v1beta):');
    if (data.models) {
      data.models.forEach((m: any) => console.log(`- ${m.name} (Supported: ${m.supportedGenerationMethods.join(', ')})`));
    } else {
      console.log('No models returned or error:', JSON.stringify(data));
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

listModels();
