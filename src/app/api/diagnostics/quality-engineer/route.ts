import { NextResponse } from "next/server";

import { getQualityEngineerSnapshot } from "@/lib/quality-engineer";

export async function GET() {
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
