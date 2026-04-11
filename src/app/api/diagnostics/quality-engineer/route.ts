import { NextResponse } from "next/server";

import { getQualityEngineerSnapshot } from "@/lib/quality-engineer";
import { requireActiveAdmin } from "@/lib/server/route-auth";

export async function GET(request: Request) {
  const authResult = await requireActiveAdmin(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const snapshot = await getQualityEngineerSnapshot();
    return NextResponse.json({
      ok: true,
      snapshot,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown quality diagnostics failure";
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
