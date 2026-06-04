
import { runAiRuntimeHandshake } from '../src/ai/runtime-health';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  console.log('--- Starting AI Runtime Handshake Test ---');
  
  try {
    const result = await runAiRuntimeHandshake({ allowRepair: true });
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.status === 'success') {
      console.log('✅ Primary model is working perfectly.');
    } else if (result.status === 'repaired') {
      console.log('⚠️ Primary model failed, but fallback was successful and applied.');
    } else {
      console.log('❌ System is broken. No working models found.');
    }
  } catch (error) {
    console.error('Handshake execution failed:', error);
  }
}

main();
