import "server-only";

import { getAi } from "@/ai/genkit";
import { getGeminiModel } from "@/ai/model-router";
import { buildRecoveredExtractionFromText, getExtractionQuality, hasMeaningfulExtraction } from "@/lib/resume-text-recovery";
import { CvDataExtractionOutput, CvDataExtractionOutputSchema, ResumeDataSchema } from "@/types/cv";

type ExtractionGuardianInput = {
  cvDataUri: string;
  cvMimeType: string;
  cvRawText?: string;
  userId?: string;
  storagePath?: string;
};

type GuardianStatus = "healthy" | "recovered" | "manual-review";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => normalizeString(value)).filter(Boolean)));
}

function deriveMissingFields(candidate: Partial<CvDataExtractionOutput>) {
  const missingFields: string[] = [];

  if (!normalizeString(candidate.personalDetails?.name)) missingFields.push("name");
  if (!normalizeString(candidate.personalDetails?.email)) missingFields.push("email");
  if (!(candidate.workExperience?.length || 0)) missingFields.push("experience");
  if (!(candidate.education?.length || 0)) missingFields.push("education");
  if (!(candidate.skills?.length || 0)) missingFields.push("skills");

  return missingFields;
}

function hasUsefulExtraction(result: CvDataExtractionOutput) {
  return hasMeaningfulExtraction(result);
}

function pickRicherExtraction(
  primary: CvDataExtractionOutput | null | undefined,
  recovered: CvDataExtractionOutput
) {
  if (!primary) return recovered;

  const primaryQuality = getExtractionQuality(primary);
  const recoveredQuality = getExtractionQuality(recovered);

  const recoveredIsClearlyBetter =
    recoveredQuality.experienceCount > primaryQuality.experienceCount ||
    recoveredQuality.educationCount > primaryQuality.educationCount ||
    (recoveredQuality.summaryLength >= 80 && primaryQuality.summaryLength < 80) ||
    (!primaryQuality.name && Boolean(recoveredQuality.name)) ||
    (primaryQuality.name && /manual|required/i.test(primaryQuality.name) && Boolean(recoveredQuality.name)) ||
    (!primaryQuality.phone && Boolean(recoveredQuality.phone)) ||
    recoveredQuality.score >= primaryQuality.score + 2;

  if (!recoveredIsClearlyBetter) {
    return primary;
  }

  return {
    ...primary,
    personalDetails: {
      ...primary.personalDetails,
      name: recovered.personalDetails?.name || primary.personalDetails?.name,
      email: recovered.personalDetails?.email || primary.personalDetails?.email,
      phone: recovered.personalDetails?.phone || primary.personalDetails?.phone,
      location:
        recovered.personalDetails?.location &&
        recovered.personalDetails.location.length > (primary.personalDetails?.location || "").length
          ? recovered.personalDetails.location
          : primary.personalDetails?.location || recovered.personalDetails?.location,
      linkedin: recovered.personalDetails?.linkedin || primary.personalDetails?.linkedin,
      website: recovered.personalDetails?.website || primary.personalDetails?.website,
    },
    summary:
      (recovered.summary || "").length > (primary.summary || "").length ? recovered.summary : primary.summary || recovered.summary,
    workExperience:
      (recovered.workExperience?.length || 0) > (primary.workExperience?.length || 0)
        ? recovered.workExperience
        : primary.workExperience,
    education:
      (recovered.education?.length || 0) > (primary.education?.length || 0)
        ? recovered.education
        : primary.education,
    skills:
      (recovered.skills?.length || 0) > (primary.skills?.length || 0)
        ? recovered.skills
        : primary.skills,
    languages:
      (recovered.languages?.length || 0) > (primary.languages?.length || 0)
        ? recovered.languages
        : primary.languages,
    projects:
      (recovered.projects?.length || 0) > (primary.projects?.length || 0)
        ? recovered.projects
        : primary.projects,
    certifications:
      (recovered.certifications?.length || 0) > (primary.certifications?.length || 0)
        ? recovered.certifications
        : primary.certifications,
    customSections:
      (recovered.customSections?.length || 0) > (primary.customSections?.length || 0)
        ? recovered.customSections
        : primary.customSections,
  };
}

function sanitizeExtractionOutput(
  candidate: Partial<CvDataExtractionOutput>,
  options: {
    jobId: string;
    confidence: number;
    parsingMethod: "multimodal" | "text-llm" | "ocr-llm" | "fallback" | "apdf-enhanced" | "hybrid-job";
    isWeak: boolean;
    missingFields?: string[];
    warnings?: string[];
    strategyUsed?: string;
    rawTextLength?: number;
    guardian: {
      activated: boolean;
      status: GuardianStatus;
      summary: string;
      attempts: number;
      appliedFixes: string[];
      lastError?: string;
    };
  }
): CvDataExtractionOutput {
  const payload: CvDataExtractionOutput = {
    personalDetails: {
      name: normalizeString(candidate.personalDetails?.name),
      email: normalizeString(candidate.personalDetails?.email),
      phone: normalizeString(candidate.personalDetails?.phone),
      location: normalizeString(candidate.personalDetails?.location),
      linkedin: normalizeString(candidate.personalDetails?.linkedin),
      website: normalizeString(candidate.personalDetails?.website),
    },
    summary: normalizeString(candidate.summary),
    workExperience: (candidate.workExperience || []).map((item) => ({
      title: normalizeString(item?.title),
      company: normalizeString(item?.company),
      location: normalizeString(item?.location),
      startDate: normalizeString(item?.startDate),
      endDate: normalizeString(item?.endDate),
      description: uniqueStrings((item?.description || []) as string[]),
    })),
    education: (candidate.education || []).map((item) => ({
      degree: normalizeString(item?.degree),
      institution: normalizeString(item?.institution),
      location: normalizeString(item?.location),
      graduationDate: normalizeString(item?.graduationDate),
      description: normalizeString(item?.description),
    })),
    skills: uniqueStrings(candidate.skills || []),
    languages: (candidate.languages || []).map((item) => ({
      language: normalizeString(item?.language),
      proficiency: normalizeString(item?.proficiency),
    })),
    projects: (candidate.projects || []).map((item) => ({
      name: normalizeString(item?.name),
      description: normalizeString(item?.description),
      url: normalizeString(item?.url),
    })),
    certifications: (candidate.certifications || []).map((item) => ({
      name: normalizeString(item?.name),
      issuer: normalizeString(item?.issuer),
      date: normalizeString(item?.date),
    })),
    customSections: (candidate.customSections || []).map((item) => ({
      title: normalizeString(item?.title),
      content: normalizeString(item?.content),
    })),
    metadata: {
      confidence: options.confidence,
      sectionConfidence: candidate.metadata?.sectionConfidence || {},
      parsingMethod: options.parsingMethod,
      missingFields: options.missingFields || [],
      warnings: options.warnings || [],
      isWeak: options.isWeak,
      jobId: options.jobId,
      strategyUsed: options.strategyUsed,
      rawTextLength: options.rawTextLength,
      guardian: options.guardian,
    },
  };

  return CvDataExtractionOutputSchema.parse(payload);
}

export async function runGuardedCvExtraction(input: ExtractionGuardianInput): Promise<CvDataExtractionOutput> {
  const jobId = `job_${Date.now()}`;
  const appliedFixes: string[] = [];
  let lastError = "";
  let rawTextLength = 0;
  let primaryResult: CvDataExtractionOutput | null = null;
  let aiRecoveredResult: CvDataExtractionOutput | null = null;

  try {
    const { extractCvData } = await import("@/ai/flows/cv-data-extraction-flow");
    const primary = await extractCvData(input);
    primaryResult = primary ? sanitizeExtractionOutput(primary, {
      jobId: primary.metadata?.jobId || jobId,
      confidence: primary.metadata?.confidence || 0.6,
      parsingMethod: primary.metadata?.parsingMethod || "text-llm",
      isWeak: Boolean(primary.metadata?.isWeak),
      missingFields: primary.metadata?.missingFields || [],
      warnings: primary.metadata?.warnings || [],
      strategyUsed: primary.metadata?.strategyUsed,
      rawTextLength: primary.metadata?.rawTextLength,
      guardian: {
        activated: false,
        status: "healthy",
        summary: "Primary extraction completed without guardian intervention.",
        attempts: 1,
        appliedFixes: [],
      },
    }) : null;

    if (primaryResult && hasUsefulExtraction(primaryResult)) {
      if ((primaryResult.metadata?.confidence || 1.0) > 0.85) {
        console.log("[ExtractionGuardian] Primary extraction is highly confident. Returning early.");
        return primaryResult;
      }
      appliedFixes.push("Primary extraction returned some usable data, but guardian is investigating text-based recovery to ensure maximum completeness.");
    } else {
      appliedFixes.push("Detected weak or empty primary extraction result. Activating guardian recovery strategies.");
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : "Unknown extraction error";
    appliedFixes.push(`Captured primary extraction failure: ${lastError.slice(0, 100)}`);
  }

  // 1b. Try Python-based extraction if AI was weak or failed
  let pythonResult: Partial<CvDataExtractionOutput> | null = null;
  if (!primaryResult || !hasUsefulExtraction(primaryResult) || (primaryResult.metadata?.confidence || 0) < 0.7) {
    try {
      const extension = input.cvMimeType === 'application/pdf' ? '.pdf' : 
                       input.cvMimeType.includes('word') ? '.docx' : '.png';
      
      // Fetch buffer for Python parser
      const { fetchDocumentBuffer } = await import("@/lib/server-document-source");
      const buffer = await fetchDocumentBuffer(input);

      const { parseBufferWithPython } = await import("@/lib/python-parser");
      pythonResult = await parseBufferWithPython(buffer, extension);
      if (pythonResult && (pythonResult.personalDetails?.name || pythonResult.skills?.length)) {
        appliedFixes.push("Recovered structured data using the Python-based robust parsing pipeline.");
      }
    } catch (err) {
      console.warn("[ExtractionGuardian] Python parser failed:", err);
    }
  }

  let rawText = normalizeString(input.cvRawText);
  rawTextLength = rawText.length;

  if (rawText.trim().length < 80) {
    try {
      const { parseDocument } = await import("@/lib/document-parser");
      const parsedDocument = await parseDocument(input.cvDataUri, input.cvMimeType, input.storagePath);
      rawText = parsedDocument.rawText || "";
      rawTextLength = rawText.length;

      if (rawText.trim().length >= 80) {
        appliedFixes.push("Successfully recovered document text via local parsing and scheduled AI recovery retry.");
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
      appliedFixes.push("Local document parsing failed; proceeding with minimal metadata recovery.");
    }
  } else {
    appliedFixes.push("Using preflight text from client as recovery source.");
  }

  if (rawText.trim().length >= 80) {
    try {
      const model = await getGeminiModel("structuredExtraction");
      const response = await getAi().generate({
        model,
        config: { temperature: 0.1 },
        system: `You are a resume extraction recovery agent.

Repair a failed CV extraction by converting recovered raw text into structured resume JSON.

Rules:
- Be conservative and factual.
- Do not invent employers, dates, or credentials.
- If a field is not present, leave it empty.
- Return JSON only.`,
        prompt: `Recover structured CV data from this raw text:

${rawText.slice(0, 25000)}`,
        output: { schema: ResumeDataSchema },
      });

      if (response.output) {
        aiRecoveredResult = sanitizeExtractionOutput(response.output, {
          jobId,
          confidence: 0.55,
          parsingMethod: "text-llm",
          isWeak: false,
          missingFields: [],
          warnings: [
            "The extraction guardian recovered this resume from parser text after the primary extraction path failed.",
          ],
          strategyUsed: "guardian-text-recovery",
          rawTextLength,
          guardian: {
            activated: true,
            status: "recovered",
            summary: "The extraction guardian recovered structured data from parser text.",
            attempts: 2,
            appliedFixes,
            lastError: lastError || undefined,
          },
        });
        if (hasUsefulExtraction(aiRecoveredResult)) {
          appliedFixes.push("Recovered structured data from parser text and queued it for comparison against deterministic recovery.");
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
      appliedFixes.push("AI text recovery path failed, switching to deterministic field extraction.");
    }
  }

  const heuristicCandidate = buildRecoveredExtractionFromText(rawText, {
    jobId,
    strategyUsed: "guardian-heuristic-recovery",
    parsingMethod: "fallback",
    warning: "Recovered a draft from raw resume text because the primary extraction path failed.",
  });
  
  // Merge Python results if available
  const baseForRicher = pythonResult 
    ? pickRicherExtraction(primaryResult, pythonResult as CvDataExtractionOutput)
    : primaryResult;

  const recoveredHeuristically = hasUsefulExtraction(heuristicCandidate);
  const richerThanPrimary = pickRicherExtraction(baseForRicher, heuristicCandidate);
  const richerCandidate = pickRicherExtraction(aiRecoveredResult ?? richerThanPrimary, richerThanPrimary);
  const richerQuality = getExtractionQuality(richerCandidate);
  const baselineCandidate = aiRecoveredResult
    ? pickRicherExtraction(primaryResult, aiRecoveredResult)
    : primaryResult;
  const primaryQuality = getExtractionQuality(baselineCandidate);
  const richerQualityBeatsPrimary =
    richerQuality.experienceCount > primaryQuality.experienceCount ||
    richerQuality.educationCount > primaryQuality.educationCount ||
    richerQuality.summaryLength > primaryQuality.summaryLength ||
    richerQuality.score > primaryQuality.score;

  if (richerQuality.hasMeaningfulExtraction && richerQualityBeatsPrimary) {
    appliedFixes.push("Promoted the deterministic text recovery result because it contained stronger resume structure than the primary AI extraction.");
    return sanitizeExtractionOutput(richerCandidate, {
      jobId,
      confidence: Math.max(primaryResult?.metadata?.confidence || 0, 0.7),
      parsingMethod: "hybrid-job",
      isWeak: false,
      missingFields: deriveMissingFields(richerCandidate),
      warnings: [
        "The extraction guardian combined AI output with text recovery to restore stronger resume structure.",
      ],
      strategyUsed: "guardian-hybrid-merge",
      rawTextLength,
      guardian: {
        activated: true,
        status: "recovered",
        summary: "The extraction guardian promoted the stronger text-based recovery result over a weaker AI extraction.",
        attempts: 3,
        appliedFixes,
        lastError: lastError || undefined,
      },
    });
  }

  return sanitizeExtractionOutput(heuristicCandidate, {
    jobId,
    confidence: recoveredHeuristically ? 0.35 : 0.1,
    parsingMethod: "fallback",
    isWeak: true,
    missingFields: deriveMissingFields(heuristicCandidate),
    warnings: recoveredHeuristically
      ? [
          "The extraction guardian returned a partial recovery from raw text because the primary extraction path failed.",
          "Please review the detected fields carefully before proceeding.",
        ]
      : [
          "The extraction guardian could not recover enough structured data automatically.",
          "Manual review is required for this file.",
        ],
    strategyUsed: recoveredHeuristically ? "guardian-heuristic-recovery" : "guardian-manual-review",
    rawTextLength,
    guardian: {
      activated: true,
      status: recoveredHeuristically ? "recovered" : "manual-review",
      summary: recoveredHeuristically
        ? "The extraction guardian recovered a partial draft and sent it to manual review."
        : "The extraction guardian prevented a crash and returned a safe manual-review payload.",
      attempts: 3,
      appliedFixes,
      lastError: lastError || undefined,
    },
  });
}
