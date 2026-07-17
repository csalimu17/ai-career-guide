import { NextResponse } from 'next/server';
import { parseLinkedInJobs } from '@/ai/flows/linkedin-job-parse-flow';
import { requireAuthenticatedUser } from '@/lib/server/route-auth';

export const runtime = 'nodejs';

// Cap on inbound LinkedIn paste — protects AI quota and bounds prompt size.
// A typical LinkedIn job board paste is well under 50KB; 200KB is generous.
const MAX_INPUT_CHARS = 200_000;

export async function POST(req: Request) {
  // SECURITY: Endpoint forwards user input directly to an LLM. Without auth,
  // anonymous callers could burn the project's AI quota and exfiltrate
  // prompt-injection payloads. Require a signed-in user.
  const authResult = await requireAuthenticatedUser(req);
  if (!authResult.ok) return authResult.response;

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required. Please paste your LinkedIn content.' }, { status: 400 });
    }

    if (text.length > MAX_INPUT_CHARS) {
      return NextResponse.json(
        { error: `Pasted text is too long (${text.length} chars). Limit is ${MAX_INPUT_CHARS}.` },
        { status: 413 },
      );
    }

    console.log(`[LinkedInImport] Parsing text of length: ${text.length} for uid: ${authResult.decodedToken.uid}`);

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
