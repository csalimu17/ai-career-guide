export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

import { atsOptimizationScoring } from '@/ai/flows/ats-optimization-scoring-flow';
import { requireAuthenticatedUser } from '@/lib/server/route-auth';

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  let payload: { cvContent?: unknown; jobDescription?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const cvContent = typeof payload.cvContent === 'string' ? payload.cvContent.trim() : '';
  const jobDescription = typeof payload.jobDescription === 'string' ? payload.jobDescription.trim() : '';

  if (!cvContent) {
    return NextResponse.json({ error: 'Resume content is required.' }, { status: 400 });
  }

  if (!jobDescription) {
    return NextResponse.json({ error: 'Job description is required.' }, { status: 400 });
  }

  try {
    const result = await atsOptimizationScoring({ cvContent, jobDescription });
    return NextResponse.json({ result });
  } catch (error) {
    console.error('[ATS API] Scan failed:', {
      uid: authResult.decodedToken.uid,
      cvLength: cvContent.length,
      jobDescriptionLength: jobDescription.length,
      error,
    });

    return NextResponse.json(
      { error: "We couldn't complete the ATS analysis right now. Please try again." },
      { status: 500 }
    );
  }
}
