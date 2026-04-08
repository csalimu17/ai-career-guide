import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { extractCvData } from './src/ai/flows/cv-data-extraction-flow';

async function testExtraction() {
  const inputPath = process.argv[2] || process.env.CV_TEST_FILE;

  if (!inputPath) {
    console.error('Usage: npx tsx test-cv-extraction.ts <path-to-cv>');
    console.error('Alternatively set the CV_TEST_FILE environment variable.');
    process.exit(1);
  }

  const filePath = path.resolve(inputPath);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Reading file: ${filePath}`);
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const dataUri = `data:application/pdf;base64,${base64}`;

  console.log("Starting CV Extraction flow...");
  try {
    const result = await extractCvData({
      cvDataUri: dataUri,
      cvMimeType: 'application/pdf',
      userId: 'test-user-id'
    });

    console.log("--- EXTRACTION COMPLETE ---");
    console.log(JSON.stringify(result, null, 2));
    
    const confidence = result.metadata?.confidence || 0;
    console.log(`\nConfidence Score: ${confidence.toFixed(2)}`);
    
    if (confidence > 0.7) {
      console.log("✅ Extraction appears successful and high-quality.");
    } else {
      console.warn("⚠️ Extraction confidence is low. Please manually verify the results.");
    }

  } catch (error) {
    console.error("Extraction failed:", error);
  }
}

testExtraction();
