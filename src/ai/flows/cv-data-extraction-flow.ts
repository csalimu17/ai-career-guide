import { getAi } from '@/ai/genkit';
import { z } from 'zod';
import { parseDocument, scoreTextQuality } from '@/lib/document-parser';
import {
  ResumeDataSchema, 
  CvDataExtractionOutputSchema, 
  CvDataExtractionOutput,
  ResumeData
} from '@/types/cv';
import { fastGeminiModel, reasoningGeminiModel } from '@/ai/genkit';
import { extractLocation } from '@/lib/document-parser';
import { cleanParsedData, isLikelyLocation, scoreFieldConfidence } from '@/lib/cv-validation';
import { extractSummaryFromText } from '@/lib/resume-text-recovery';
import { resolveDocumentDataUri } from '@/lib/server-document-source';

/**
 * Advanced Hybrid CV Extraction Pipeline.
 * --------------------------------------
 * IMPLEMENTS:
 * 1. Automatic strategy selection.
 * 2. High-fidelity multi-model scoring.
 * 3. Confidence-weighted selection.
 * 4. Comprehensive Section Mapping.
 */

function normalizeValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => normalizeValue(value)).filter(Boolean)));
}

function containsEducationKeyword(value: string) {
  return /\b(bachelor|master|msc|mba|bsc|ba|phd|doctorate|diploma|certificate|certification|gcse|a-level|university|college|school|academy|institute|course)\b/i.test(
    value
  );
}

function containsInstitutionKeyword(value: string) {
  return /\b(university|college|school|academy|institute|faculty|campus)\b/i.test(value);
}

function containsRoleKeyword(value: string) {
  return /\b(engineer|developer|manager|analyst|consultant|designer|assistant|specialist|lead|intern|director|coordinator|administrator|officer|executive)\b/i.test(
    value
  );
}

function containsSkillNoise(value: string) {
  return (
    !value ||
    value.length > 60 ||
    /@|https?:\/\/|linkedin\.com|www\./i.test(value) ||
    /\b(summary|profile|experience|education|employment|skills|projects|certifications)\b/i.test(value) ||
    /((19|20)\d{2})/.test(value)
  );
}

function sanitizeSkillList(values: string[] | undefined) {
  const expanded = (values || []).flatMap((value) =>
    normalizeValue(value)
      .split(/,|•|\||;/)
      .map((item) => item.trim())
      .filter(Boolean)
  );

  return uniqueStrings(expanded).filter((value) => !containsSkillNoise(value)).slice(0, 24);
}

function sanitizeDescriptionLines(values: string[] | undefined) {
  return uniqueStrings(values || [])
    .filter((line) => {
      const normalized = normalizeValue(line);
      return (
        normalized.length >= 8 &&
        !/^(summary|profile|experience|education|skills|projects|certifications?)$/i.test(normalized)
      );
    })
    .slice(0, 8);
}

function tightenSectionPlacement(data: ResumeData): ResumeData {
  const promotedEducation: NonNullable<ResumeData["education"]> = [];
  const promotedExperience: NonNullable<ResumeData["workExperience"]> = [];

  const workExperience = (data.workExperience || []).reduce<NonNullable<ResumeData["workExperience"]>>((acc, entry) => {
    const title = normalizeValue(entry?.title);
    const company = normalizeValue(entry?.company);
    const description = sanitizeDescriptionLines(entry?.description);
    const startDate = normalizeValue(entry?.startDate);
    const endDate = normalizeValue(entry?.endDate);

    const looksLikeEducationBlock =
      (containsEducationKeyword(title) || containsInstitutionKeyword(company)) &&
      !containsRoleKeyword(title) &&
      !startDate &&
      !endDate;

    if (looksLikeEducationBlock) {
      promotedEducation.push({
        degree: title,
        institution: company,
        graduationDate: "",
        description: description.join(" ").slice(0, 240),
      });
      return acc;
    }

    acc.push({
      ...entry,
      title,
      company,
      location: normalizeValue(entry?.location),
      startDate,
      endDate,
      description,
    });
    return acc;
  }, []);

  const education = (data.education || []).reduce<NonNullable<ResumeData["education"]>>((acc, entry) => {
    const degree = normalizeValue(entry?.degree);
    const institution = normalizeValue(entry?.institution);
    const graduationDate = normalizeValue(entry?.graduationDate);
    const description = normalizeValue(entry?.description);

    const looksLikeExperienceBlock =
      containsRoleKeyword(degree) &&
      !containsEducationKeyword(degree) &&
      institution.length > 0 &&
      !containsInstitutionKeyword(institution);

    if (looksLikeExperienceBlock) {
      promotedExperience.push({
        title: degree,
        company: institution,
        startDate: "",
        endDate: graduationDate,
        location: normalizeValue(entry?.location),
        description: description ? [description] : [],
      });
      return acc;
    }

    acc.push({
      ...entry,
      degree,
      institution,
      location: normalizeValue(entry?.location),
      graduationDate,
      description,
    });
    return acc;
  }, []);

  return {
    ...data,
    workExperience: mergeExperience(workExperience, promotedExperience),
    education: mergeEducation(education, promotedEducation),
    skills: sanitizeSkillList(data.skills),
  };
}

function mergeLineArrays(left: string[] | undefined, right: string[] | undefined) {
  return uniqueStrings([...(left || []), ...(right || [])]);
}

function mergeExperience(
  left: ResumeData["workExperience"] = [],
  right: ResumeData["workExperience"] = []
) {
  const merged = [...left];

  for (const entry of right) {
    const fingerprint = [
      normalizeValue(entry?.title).toLowerCase(),
      normalizeValue(entry?.company).toLowerCase(),
      normalizeValue(entry?.startDate).toLowerCase(),
      normalizeValue(entry?.endDate).toLowerCase(),
    ].join("|");

    const existingIndex = merged.findIndex((candidate) => {
      const candidateFingerprint = [
        normalizeValue(candidate?.title).toLowerCase(),
        normalizeValue(candidate?.company).toLowerCase(),
        normalizeValue(candidate?.startDate).toLowerCase(),
        normalizeValue(candidate?.endDate).toLowerCase(),
      ].join("|");
      return candidateFingerprint === fingerprint && fingerprint !== "|||";
    });

    if (existingIndex < 0) {
      merged.push({
        ...entry,
        description: mergeLineArrays(entry?.description, []),
      });
      continue;
    }

    merged[existingIndex] = {
      ...merged[existingIndex],
      ...entry,
      title: normalizeValue(merged[existingIndex]?.title) || normalizeValue(entry?.title),
      company: normalizeValue(merged[existingIndex]?.company) || normalizeValue(entry?.company),
      location:
        normalizeValue(entry?.location).length > normalizeValue(merged[existingIndex]?.location).length
          ? normalizeValue(entry?.location)
          : normalizeValue(merged[existingIndex]?.location),
      startDate: normalizeValue(merged[existingIndex]?.startDate) || normalizeValue(entry?.startDate),
      endDate: normalizeValue(merged[existingIndex]?.endDate) || normalizeValue(entry?.endDate),
      description: mergeLineArrays(merged[existingIndex]?.description, entry?.description),
    };
  }

  return merged.filter((entry) =>
    Boolean(
      normalizeValue(entry?.title) ||
        normalizeValue(entry?.company) ||
        normalizeValue(entry?.startDate) ||
        normalizeValue(entry?.endDate) ||
        (entry?.description || []).length
    )
  );
}

function mergeEducation(
  left: ResumeData["education"] = [],
  right: ResumeData["education"] = []
) {
  const merged = [...left];

  for (const entry of right) {
    const fingerprint = [
      normalizeValue(entry?.degree).toLowerCase(),
      normalizeValue(entry?.institution).toLowerCase(),
      normalizeValue(entry?.graduationDate).toLowerCase(),
    ].join("|");

    const existingIndex = merged.findIndex((candidate) => {
      const candidateFingerprint = [
        normalizeValue(candidate?.degree).toLowerCase(),
        normalizeValue(candidate?.institution).toLowerCase(),
        normalizeValue(candidate?.graduationDate).toLowerCase(),
      ].join("|");
      return candidateFingerprint === fingerprint && fingerprint !== "||";
    });

    if (existingIndex < 0) {
      merged.push(entry);
      continue;
    }

    merged[existingIndex] = {
      ...merged[existingIndex],
      ...entry,
      degree: normalizeValue(merged[existingIndex]?.degree) || normalizeValue(entry?.degree),
      institution: normalizeValue(merged[existingIndex]?.institution) || normalizeValue(entry?.institution),
      location:
        normalizeValue(entry?.location).length > normalizeValue(merged[existingIndex]?.location).length
          ? normalizeValue(entry?.location)
          : normalizeValue(merged[existingIndex]?.location),
      graduationDate:
        normalizeValue(merged[existingIndex]?.graduationDate) || normalizeValue(entry?.graduationDate),
      description:
        normalizeValue(entry?.description).length > normalizeValue(merged[existingIndex]?.description).length
          ? normalizeValue(entry?.description)
          : normalizeValue(merged[existingIndex]?.description),
    };
  }

  return merged.filter((entry) =>
    Boolean(
      normalizeValue(entry?.degree) ||
        normalizeValue(entry?.institution) ||
        normalizeValue(entry?.graduationDate)
    )
  );
}

function mergeResumeCandidates(base: ResumeData | null | undefined, incoming: ResumeData | null | undefined): ResumeData {
  const left = base || {};
  const right = incoming || {};

  return {
    personalDetails: {
      name:
        normalizeValue(right.personalDetails?.name).split(/\s+/).length >= normalizeValue(left.personalDetails?.name).split(/\s+/).length
          ? normalizeValue(right.personalDetails?.name) || normalizeValue(left.personalDetails?.name)
          : normalizeValue(left.personalDetails?.name) || normalizeValue(right.personalDetails?.name),
      email: normalizeValue(left.personalDetails?.email) || normalizeValue(right.personalDetails?.email),
      phone:
        normalizeValue(right.personalDetails?.phone).length > normalizeValue(left.personalDetails?.phone).length
          ? normalizeValue(right.personalDetails?.phone)
          : normalizeValue(left.personalDetails?.phone) || normalizeValue(right.personalDetails?.phone),
      location:
        normalizeValue(right.personalDetails?.location).length > normalizeValue(left.personalDetails?.location).length
          ? normalizeValue(right.personalDetails?.location)
          : normalizeValue(left.personalDetails?.location) || normalizeValue(right.personalDetails?.location),
      linkedin: normalizeValue(left.personalDetails?.linkedin) || normalizeValue(right.personalDetails?.linkedin),
      website: normalizeValue(left.personalDetails?.website) || normalizeValue(right.personalDetails?.website),
    },
    summary:
      normalizeValue(right.summary).length > normalizeValue(left.summary).length
        ? normalizeValue(right.summary)
        : normalizeValue(left.summary) || normalizeValue(right.summary),
    workExperience: mergeExperience(left.workExperience, right.workExperience),
    education: mergeEducation(left.education, right.education),
    skills: uniqueStrings([...(left.skills || []), ...(right.skills || [])]),
    languages: [...(left.languages || []), ...(right.languages || [])].filter(
      (item, index, all) =>
        all.findIndex(
          (candidate) =>
            normalizeValue(candidate?.language).toLowerCase() === normalizeValue(item?.language).toLowerCase() &&
            normalizeValue(candidate?.proficiency).toLowerCase() === normalizeValue(item?.proficiency).toLowerCase()
        ) === index
    ),
    projects: [...(left.projects || []), ...(right.projects || [])].filter(
      (item, index, all) =>
        all.findIndex(
          (candidate) =>
            normalizeValue(candidate?.name).toLowerCase() === normalizeValue(item?.name).toLowerCase() &&
            normalizeValue(candidate?.url).toLowerCase() === normalizeValue(item?.url).toLowerCase()
        ) === index
    ),
    certifications: [...(left.certifications || []), ...(right.certifications || [])].filter(
      (item, index, all) =>
        all.findIndex(
          (candidate) =>
            normalizeValue(candidate?.name).toLowerCase() === normalizeValue(item?.name).toLowerCase() &&
            normalizeValue(candidate?.issuer).toLowerCase() === normalizeValue(item?.issuer).toLowerCase()
        ) === index
    ),
    customSections: [...(left.customSections || []), ...(right.customSections || [])].filter(
      (item, index, all) =>
        all.findIndex(
          (candidate) =>
            normalizeValue(candidate?.title).toLowerCase() === normalizeValue(item?.title).toLowerCase()
        ) === index
    ),
  };
}

function scoreCandidateRichness(data: ResumeData | null | undefined) {
  if (!data) return 0;

  let score = 0;
  if (normalizeValue(data.personalDetails?.name)) score += 2;
  if (normalizeValue(data.personalDetails?.email)) score += 2;
  if (normalizeValue(data.personalDetails?.phone)) score += 1;
  if (normalizeValue(data.personalDetails?.location)) score += 1;
  if (normalizeValue(data.summary).length >= 80) score += 2;
  score += Math.min((data.workExperience || []).length * 2, 8);
  score += Math.min((data.education || []).length * 1.5, 4);
  score += Math.min((data.skills || []).length * 0.35, 3);
  return score;
}

function buildExtractionSegments(rawText: string) {
  const normalized = rawText.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const paragraphs = normalized.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean);
  const segments: string[] = [];
  const pushSegment = (value: string) => {
    const segment = value.trim();
    if (!segment || segment.length < 10) return;
    if (!segments.includes(segment)) {
      segments.push(segment.slice(0, 3200));
    }
  };

  pushSegment(lines.slice(0, 12).join("\n"));
  pushSegment(lines.slice(0, 24).join("\n"));

  paragraphs.slice(0, 10).forEach((paragraph) => pushSegment(paragraph));

  for (let index = 0; index < Math.min(lines.length, 60); index += 8) {
    pushSegment(lines.slice(index, index + 12).join("\n"));
  }

  return segments.slice(0, 10);
}

export async function extractCvData(input: any): Promise<CvDataExtractionOutput> {
  const ai = getAi();
  
  const flow = ai.defineFlow(
    {
      name: 'extractCvData',
      inputSchema: z.object({
        cvDataUri: z.string().describe('Public file URL (Firebase Storage) or Data URI'),
        cvMimeType: z.string(),
        cvRawText: z.string().optional(),
        userId: z.string().optional(),
        storagePath: z.string().optional(),
      }),
      outputSchema: CvDataExtractionOutputSchema,
    },
    async (innerInput: any) => {
      const { cvDataUri, cvMimeType, cvRawText, userId, storagePath } = innerInput;
      const jobId = `job_${Date.now()}`;
      // ... (rest of logic) ...
      const logs: any[] = [];
      const addLog = (stage: string, message: string, data?: any) => {
         const log = { timestamp: new Date().toISOString(), stage, message, data };
         console.log(`[${jobId}] ${stage}: ${message}`, data || '');
         logs.push(log);
      };

      addLog('INIT', 'Initializing multi-strategy CV extraction.', { mimeType: cvMimeType });

      try {
        const primaryDoc = await parseDocument(cvDataUri, cvMimeType, storagePath);
        const preflightText = (cvRawText || "").trim();
        const effectiveRawText = preflightText.length > primaryDoc.rawText.length ? preflightText : primaryDoc.rawText;
        const segments = buildExtractionSegments(effectiveRawText);
        const effectiveDoc = {
          ...primaryDoc,
          rawText: effectiveRawText,
          method: preflightText.length > primaryDoc.rawText.length ? "native" : primaryDoc.method,
          isScanned: preflightText.length > primaryDoc.rawText.length ? false : primaryDoc.isScanned,
        };
        const primaryScore = scoreTextQuality(effectiveDoc.rawText);
        
        const locationHint = extractLocation(effectiveDoc.rawText);
        const summaryHint = extractSummaryFromText(effectiveDoc.rawText);
        const emailMatch = effectiveDoc.rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = effectiveDoc.rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        
        addLog('SCAN', 'Base extraction complete.', { 
          method: effectiveDoc.method, 
          isScanned: effectiveDoc.isScanned,
          textQuality: primaryScore,
          hints: { location: !!locationHint, summary: !!summaryHint, email: !!emailMatch, phone: !!phoneMatch }
        });

        let results: { data: ResumeData, score: number, method: string }[] = [];
        let multimodalCandidate: ResumeData | null = null;

        addLog('BRAIN', 'Executing Multimodal Analysis (Gemini 1.5 Flash)...');
        try {
          const base64Data = await resolveDocumentDataUri({ cvDataUri, cvMimeType, storagePath });

          const res = await ai.generate({
            model: reasoningGeminiModel,
            prompt: [
              { text: `You are a world-class professional CV analyst. Extract data...` },
              { media: { url: base64Data, contentType: cvMimeType } }
            ],
            output: { schema: ResumeDataSchema }
          });
          
          if (res.output) {
            multimodalCandidate = res.output as ResumeData;
            results.push({
              data: multimodalCandidate,
              score: 0.62 + scoreCandidateRichness(multimodalCandidate) * 0.025,
              method: 'multimodal'
            });
          }
        } catch (e: any) { 
          addLog('WARN', `Gemini Multimodal failed: ${e.message}`); 
        }

        if (results.length === 0 || primaryScore > 0.8) {
           addLog('BRAIN', 'Executing Text Fallback...');
           try {
              const textCandidates: ResumeData[] = [];
              for (const segment of segments) {
                const res = await ai.generate({
                  model: fastGeminiModel,
                  prompt: `Extract structured resume data... segment: ${segment}`,
                  output: { schema: ResumeDataSchema }
                });
                if (res.output) textCandidates.push(res.output);
              }

              if (textCandidates.length) {
                const mergedTextCandidate = textCandidates.reduce<ResumeData | null>(
                  (aggregate, candidate) => mergeResumeCandidates(aggregate, candidate),
                  null
                ) as ResumeData;

                results.push({
                  data: mergedTextCandidate,
                  score: Math.min(0.92, 0.45 + primaryScore * 0.28 + scoreCandidateRichness(mergedTextCandidate) * 0.03),
                  method: 'text-llm'
                });

                if (multimodalCandidate) {
                  const hybridCandidate = mergeResumeCandidates(multimodalCandidate, mergedTextCandidate);
                  results.push({
                    data: hybridCandidate,
                    score: Math.min(0.97, 0.58 + primaryScore * 0.24 + scoreCandidateRichness(hybridCandidate) * 0.032),
                    method: 'hybrid-job'
                  });
                }
              }
           } catch (e: any) { addLog('WARN', 'Flash Fallback failed.'); }
        }

        results.sort((a, b) => b.score - a.score);
        const best = results[0];

        if (!best) return { personalDetails: { name: "Manual Upload Required" }, metadata: { confidence: 0.1, isWeak: true, parsingMethod: 'fallback', missingFields: ['all'] } } as CvDataExtractionOutput;

        const mapped = {
          name: best.data.personalDetails?.name || "",
          email: best.data.personalDetails?.email || emailMatch?.[0] || "",
          phone: best.data.personalDetails?.phone || phoneMatch?.[0] || "",
          location: best.data.personalDetails?.location || "",
          summary: best.data.summary || summaryHint || "",
        };

        if (!isLikelyLocation(mapped.location)) mapped.location = locationHint || "";
        if (mapped.location && mapped.location.split(" ").length > 6) {
          mapped.summary = mapped.summary || mapped.location;
          mapped.location = "";
        }

        const cleanedValues = cleanParsedData(mapped);
        const normalizedResumeData = tightenSectionPlacement({
          ...best.data,
          personalDetails: {
            ...best.data.personalDetails,
            name: cleanedValues.name,
            email: cleanedValues.email,
            phone: cleanedValues.phone,
            location: cleanedValues.location,
          },
          summary: cleanedValues.summary,
        });

        const checks = [
          { key: 'name', val: normalizedResumeData.personalDetails?.name, weight: 0.2 },
          { key: 'email', val: normalizedResumeData.personalDetails?.email, weight: 0.1 },
          { key: 'experience', val: normalizedResumeData.workExperience?.length, weight: 0.4 },
          { key: 'education', val: normalizedResumeData.education?.length, weight: 0.2 },
          { key: 'skills', val: normalizedResumeData.skills?.length, weight: 0.1 },
        ];

        let totalConfidence = 0;
        const sectionConfidence: any = {};
        const missingFields: string[] = [];
        checks.forEach(c => {
          const hasData = !!c.val && (Array.isArray(c.val) ? c.val.length > 0 : true);
          const score = hasData ? 1 : 0;
          sectionConfidence[c.key] = score;
          if (!hasData) missingFields.push(c.key);
          totalConfidence += score * c.weight;
        });

        return {
          ...normalizedResumeData,
          metadata: {
            confidence: totalConfidence,
            sectionConfidence,
            parsingMethod: best.method as any,
            missingFields,
            isWeak: totalConfidence < 0.5,
            jobId,
            strategyUsed: best.method,
            rawTextLength: effectiveDoc.rawText.length
          }
        };

      } catch (error: any) {
        addLog('CRITICAL', 'Pipeline crash.', { error: error.message });
        return { personalDetails: { name: "Manual Verification Required" }, metadata: { confidence: 0.1, parsingMethod: 'fallback', missingFields: ['ALL'], isWeak: true, jobId } } as CvDataExtractionOutput;
      }
    }
  );

  return flow(input);
}
