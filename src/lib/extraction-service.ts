import "server-only";

import { CvDataExtractionOutputSchema, type CvDataExtractionOutput } from "@/types/cv";

type ExtractionJobHandle = {
  update: (payload: Record<string, unknown>) => Promise<void>;
};

export type ExtractionRequest = {
  cvDataUri: string;
  cvMimeType: string;
  cvRawText?: string;
  userId?: string;
  storagePath?: string;
};

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, stripUndefinedDeep(entryValue)])
    ) as T;
  }

  return value;
}

export function toSerializableExtractionOutput(value: CvDataExtractionOutput): CvDataExtractionOutput {
  return CvDataExtractionOutputSchema.parse(JSON.parse(JSON.stringify(stripUndefinedDeep(value))));
}

async function safeRecordQualitySignal(
  payload: Parameters<typeof import("@/lib/quality-engineer").recordQualitySignal>[0]
) {
  try {
    const { recordQualitySignal } = await import("@/lib/quality-engineer");
    await recordQualitySignal(payload);
  } catch (error) {
    console.error("[QualityEngineer] Signal write skipped:", error);
  }
}

async function safeUpdateJobHandle(
  jobHandle: ExtractionJobHandle | null,
  payload: Record<string, unknown>,
  jobId: string,
  stage: "success" | "failure"
) {
  try {
    await jobHandle?.update(payload);
  } catch (error) {
    console.error(`[Job ${jobId}] Monitor update failed during ${stage}:`, error);
  }
}

async function getExtractionJobHandle(jobId: string, userId: string, mimeType: string): Promise<ExtractionJobHandle | null> {
  try {
    const [{ db }, { FieldValue }] = await Promise.all([
      import("@/firebase/admin"),
      import("firebase-admin/firestore"),
    ]);

    const jobRef = db.collection("resumeExtractionJobs").doc(jobId);
    await jobRef.set({
      jobId,
      userId,
      mimeType,
      status: "extracting",
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      update: async (payload) => {
        await jobRef.set(
          {
            ...stripUndefinedDeep(payload),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      },
    };
  } catch (error) {
    console.error("[Job Error] Extraction monitor could not initialize:", error);
    return null;
  }
}

function buildEmergencyFallback(message: string, jobId: string): CvDataExtractionOutput {
  return toSerializableExtractionOutput({
    personalDetails: { name: "Manual Verification Needed" },
    summary: "",
    workExperience: [],
    education: [],
    skills: [],
    languages: [],
    projects: [],
    certifications: [],
    customSections: [],
    metadata: {
      confidence: 0,
      sectionConfidence: {},
      parsingMethod: "fallback",
      missingFields: ["all"],
      warnings: [
        `The extraction engine encountered an error: ${message}`,
        "The built-in extraction guardian returned a safe recovery payload. Please review the document manually.",
      ],
      isWeak: true,
      jobId,
      strategyUsed: "guardian-emergency-fallback",
      rawTextLength: 0,
      guardian: {
        activated: true,
        status: "manual-review",
        summary: "The extraction guardian prevented a server crash and returned a safe manual-review payload.",
        attempts: 1,
        appliedFixes: ["Converted the server-action failure into a manual-review recovery payload."],
        lastError: message,
      },
    },
  });
}

export async function runCvExtractionPipeline(data: ExtractionRequest): Promise<CvDataExtractionOutput> {
  const timestamp = Date.now();
  const jobId = `job_${timestamp}`;
  const userId = data.userId || "anonymous";

  console.log(`[Job ${jobId}] Started for MIME:`, data.cvMimeType);

  const jobHandle = await getExtractionJobHandle(jobId, userId, data.cvMimeType);

  try {
    const { runGuardedCvExtraction } = await import("@/lib/extraction-guardian");
    const result = await runGuardedCvExtraction({ ...data });
    const safeResult = toSerializableExtractionOutput(result);
    const guardian = safeResult.metadata?.guardian;

    await safeUpdateJobHandle(
      jobHandle,
      {
        status: guardian?.status === "manual-review"
          ? "review_required"
          : safeResult.metadata?.isWeak
          ? "review_required"
          : "completed",
        confidence: safeResult.metadata?.confidence || 0,
        strategy: safeResult.metadata?.parsingMethod || "fallback",
        guardian,
        result: safeResult,
      },
      jobId,
      "success"
    );

    await safeRecordQualitySignal({
      category: "extraction",
      eventType: "cv_extraction_completed",
      status:
        guardian?.status === "manual-review"
          ? "critical"
          : guardian?.status === "recovered" || safeResult.metadata?.isWeak
          ? "warning"
          : "healthy",
      summary:
        guardian?.status === "manual-review"
          ? "Extraction finished in manual-review mode."
          : guardian?.status === "recovered"
          ? "Extraction recovered after a primary-path issue."
          : "Extraction completed cleanly.",
      userId,
      jobId,
      metadata: {
        confidence: safeResult.metadata?.confidence || 0,
        parsingMethod: safeResult.metadata?.parsingMethod || "fallback",
        guardianStatus: guardian?.status || "healthy",
        strategyUsed: safeResult.metadata?.strategyUsed || "",
        missingFields: safeResult.metadata?.missingFields || [],
      },
    });

    return safeResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown extraction failure";
    console.error(`[Job ${jobId}] CRITICAL FAIL:`, message);

    await safeUpdateJobHandle(
      jobHandle,
      {
        status: "failed_soft",
        error: message,
      },
      jobId,
      "failure"
    );

    await safeRecordQualitySignal({
      category: "extraction",
      eventType: "cv_extraction_failed_soft",
      status: "critical",
      summary: "Extraction action fell back to emergency recovery payload.",
      detail: message,
      userId,
      jobId,
      metadata: {
        mimeType: data.cvMimeType,
      },
    });

    return buildEmergencyFallback(message, jobId);
  }
}
