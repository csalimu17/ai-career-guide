import { NextResponse } from 'next/server';
import { parseLinkedInJobs } from '@/ai/flows/linkedin-job-parse-flow';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required. Please paste your LinkedIn content.' }, { status: 400 });
    }

    console.log(`[LinkedInImport] Parsing text of length: ${text.length}`);
    
    // Call the Genkit flow
    const result = await parseLinkedInJobs({ text });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[LinkedInImportAPI] CRITICAL ERROR:', error.message || error);
    return NextResponse.json({ 
      error: 'Failed to process LinkedIn text. Our AI models might be busy.',
      details: error.message 
    }, { status: 500 });
  }
}
