
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const keys = [
  'GEMINI_API_KEY',
  'GOOGLE_GENAI_API_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_API_KEY'
];

console.log('--- API KEYS CHECK ---');
keys.forEach(key => {
  const val = process.env[key];
  console.log(`${key}: ${val ? 'SET (length: ' + val.length + ')' : 'NOT SET'}`);
});
console.log('----------------------');
