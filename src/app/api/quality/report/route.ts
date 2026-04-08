import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { recordQualitySignal } from "@/lib/quality-engineer";

const QualitySignalSchema = z.object({
  category: z.enum(["upload", "extraction", "editor", "print"]),
  eventType: z.string().min(1),
  status: z.enum(["healthy", "warning", "critical"]),
  summary: z.string().min(1),
  detail: z.string().optional(),
  userId: z.string().optional(),
  resumeId: z.string().optional(),
  jobId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = QualitySignalSchema.parse(await request.json());
    await recordQualitySignal(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown quality signal failure";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
