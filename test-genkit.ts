import { ai, fastGeminiModel } from './src/ai/genkit';
import * as fs from 'fs';

async function main() {
  const model = fastGeminiModel;
  console.log('Model:', model);
  
  // Dummy PDF 
  const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n').toString('base64');
  const base64Data = `data:application/pdf;base64,${dummyPdf}`;
  
  try {
    const res = await ai.generate({
      model,
      prompt: [
        { text: "Extract text from this PDF." },
        { media: { url: base64Data, contentType: 'application/pdf' } }
      ]
    });
    console.log('Success:', res.text);
  } catch(e) {
    console.error('Error:', e);
  }
}

main();
