import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { recordQualitySignal } from "@/lib/quality-engineer";
import { requireAuthenticatedUser } from "@/lib/server/route-auth";

const QualitySignalSchema = z.object({
  category: z.enum(["upload", "extraction", "editor", "print"]),
  eventType: z.string().min(1),
  status: z.enum(["healthy", "warning", "critical"]),
  summary: z.string().min(1),
  detail: z.string().optional(),
  // userId is no longer trusted from the body; we override with the
  // authenticated uid below. Field kept optional in the schema for
  // backwards compatibility with existing callers.
  userId: z.string().optional(),
  resumeId: z.string().optional(),
  jobId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  // SECURITY: Previously unauthenticated. Anyone could spam fake quality
  // signals with arbitrary userId / resumeId to skew internal dashboards
  // or attribute critical events to specific users. Require a signed-in
  // Firebase session and always overwrite the body's `userId` with the
  // authenticated uid before recording.
  const authResult = await requireAuthenticatedUser(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = QualitySignalSchema.parse(await request.json());
    await recordQualitySignal({
      ...payload,
      userId: authResult.decodedToken.uid,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown quality signal failure";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
