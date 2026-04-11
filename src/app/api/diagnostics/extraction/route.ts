import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runGuardedCvExtraction } from "@/lib/extraction-guardian";
import { runCvExtractionPipeline } from "@/lib/extraction-service";
import { parseDocument } from "@/lib/document-parser";
import { extractPdfText } from "@/lib/pdf-text";
import { requireActiveAdmin } from "@/lib/server/route-auth";

export async function GET(request: Request) {
  const authResult = await requireActiveAdmin(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const sampleResume = `Alex Morgan
alex.morgan@example.com
+44 7700 900123
London, UK
linkedin.com/in/alexmorgan

Professional Summary
Product-focused software engineer with 6 years of experience building React and Node.js applications.

Experience
Senior Software Engineer
Northstar Labs
2022 - Present
- Led development of customer-facing dashboard used by 50,000+ users.
- Improved API response times by 38% through query optimization.

Software Engineer
Bright Systems
2019 - 2022
- Built internal tooling in TypeScript and React.
- Collaborated with design and product on feature delivery.

Education
BSc Computer Science
University of Manchester
2019

Skills
React, TypeScript, Node.js, Next.js, SQL, AWS`;
  const qaPdfRecoveryText = `Your Name
London, UK

Summary
Product-minded analyst with 8+ years improving workflow quality, stakeholder clarity, and measurable delivery outcomes across hiring and operations teams.

Experience
Senior Product Analyst
Northbridge Labs
2022 - Present
- Reduced manual review time by 38% across hiring workflows.
- Built ATS and reporting systems used by internal stakeholders.

Education
BSc Business Analytics
University of Leeds
2018

Skills
Product analytics, ATS optimization, Resume strategy, Stakeholder alignment, SQL, Experimentation`;

  const dataUri = `data:text/plain;base64,${Buffer.from(sampleResume, "utf8").toString("base64")}`;
  const qaResumePdfPath = path.join(process.cwd(), "qa_second_pass", "editor-current-template.pdf");

  try {
    let qaBuffer: Buffer | null = null;
    let qaFixtureMessage: string | null = null;

    try {
      qaBuffer = await readFile(qaResumePdfPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
        throw error;
      }

      qaFixtureMessage = "Optional QA fixture PDF not found. Text-based extraction checks still ran successfully.";
    }

    const [healthy, recovered, actionText] = await Promise.all([
      runGuardedCvExtraction({
        cvDataUri: dataUri,
        cvMimeType: "text/plain",
        userId: "diagnostics",
      }),
      runGuardedCvExtraction({
        cvDataUri: "https://example.invalid/nonexistent.pdf",
        cvMimeType: "application/pdf",
        userId: "diagnostics",
      }),
      runCvExtractionPipeline({
        cvDataUri: dataUri,
        cvMimeType: "text/plain",
        userId: "diagnostics-action",
      }),
    ]);

    let directPdfCheck:
      | {
          ok: true;
          rawTextLength: number;
          sample: string;
        }
      | {
          ok: false;
          error: string;
        }
      | {
          ok: false;
          skipped: true;
          error: string;
        } = {
      ok: false,
      skipped: true,
      error: qaFixtureMessage ?? "Optional QA fixture PDF not available.",
    };

    let qaPdf:
      | {
          name: string | undefined;
          email: string | undefined;
          parsingMethod: unknown;
          confidence: unknown;
          guardian: unknown;
          skills: unknown[];
          summary: string;
          missingFields: unknown[];
        }
      | {
          skipped: true;
          reason: string;
        } = {
      skipped: true,
      reason: qaFixtureMessage ?? "Optional QA fixture PDF not available.",
    };

    let qaPdfParser:
      | {
          method: string;
          isScanned: boolean;
          rawTextLength: number;
          sample: string;
        }
      | {
          skipped: true;
          reason: string;
        } = {
      skipped: true,
      reason: qaFixtureMessage ?? "Optional QA fixture PDF not available.",
    };

    let actionPdf:
      | {
          name: string | undefined;
          email: string | undefined;
          parsingMethod: unknown;
          confidence: unknown;
          guardian: unknown;
          missingFields: unknown[];
        }
      | {
          skipped: true;
          reason: string;
        } = {
      skipped: true,
      reason: qaFixtureMessage ?? "Optional QA fixture PDF not available.",
    };

    let actionPdfWithPreflight:
      | {
          name: string | undefined;
          email: string | undefined;
          parsingMethod: unknown;
          confidence: unknown;
          guardian: unknown;
          missingFields: unknown[];
        }
      | {
          skipped: true;
          reason: string;
        } = {
      skipped: true,
      reason: qaFixtureMessage ?? "Optional QA fixture PDF not available.",
    };

    if (qaBuffer) {
      const qaPdfDataUri = `data:application/pdf;base64,${qaBuffer.toString("base64")}`;
      directPdfCheck = await (async () => {
        try {
          const text = await extractPdfText(qaBuffer);

          return {
            ok: true as const,
            rawTextLength: text.length,
            sample: text.slice(0, 220),
          };
        } catch (error) {
          return {
            ok: false as const,
            error: error instanceof Error ? error.message : "Unknown direct PDF parse error",
          };
        }
      })();

      const [guardedPdf, parsedPdf, pipelinePdf, pipelinePdfWithPreflight] = await Promise.all([
        runGuardedCvExtraction({
          cvDataUri: qaPdfDataUri,
          cvMimeType: "application/pdf",
          userId: "diagnostics",
        }),
        parseDocument(qaPdfDataUri, "application/pdf"),
        runCvExtractionPipeline({
          cvDataUri: qaPdfDataUri,
          cvMimeType: "application/pdf",
          userId: "diagnostics-action",
        }),
        runCvExtractionPipeline({
          cvDataUri: qaPdfDataUri,
          cvMimeType: "application/pdf",
          cvRawText: qaPdfRecoveryText,
          userId: "diagnostics-action",
        }),
      ]);

      qaPdf = {
        name: guardedPdf.personalDetails?.name,
        email: guardedPdf.personalDetails?.email,
        parsingMethod: guardedPdf.metadata?.parsingMethod,
        confidence: guardedPdf.metadata?.confidence,
        guardian: guardedPdf.metadata?.guardian,
        skills: guardedPdf.skills?.slice(0, 6) || [],
        summary: guardedPdf.summary?.slice(0, 180) || "",
        missingFields: guardedPdf.metadata?.missingFields || [],
      };

      qaPdfParser = {
        method: parsedPdf.method,
        isScanned: parsedPdf.isScanned,
        rawTextLength: parsedPdf.rawText.length,
        sample: parsedPdf.rawText.slice(0, 220),
      };

      actionPdf = {
        name: pipelinePdf.personalDetails?.name,
        email: pipelinePdf.personalDetails?.email,
        parsingMethod: pipelinePdf.metadata?.parsingMethod,
        confidence: pipelinePdf.metadata?.confidence,
        guardian: pipelinePdf.metadata?.guardian,
        missingFields: pipelinePdf.metadata?.missingFields || [],
      };

      actionPdfWithPreflight = {
        name: pipelinePdfWithPreflight.personalDetails?.name,
        email: pipelinePdfWithPreflight.personalDetails?.email,
        parsingMethod: pipelinePdfWithPreflight.metadata?.parsingMethod,
        confidence: pipelinePdfWithPreflight.metadata?.confidence,
        guardian: pipelinePdfWithPreflight.metadata?.guardian,
        missingFields: pipelinePdfWithPreflight.metadata?.missingFields || [],
      };
    }

    return NextResponse.json({
      ok: true,
      qaPdfFixture: {
        available: Boolean(qaBuffer),
        path: qaResumePdfPath,
        message: qaFixtureMessage,
      },
      healthy: {
        name: healthy.personalDetails?.name,
        email: healthy.personalDetails?.email,
        parsingMethod: healthy.metadata?.parsingMethod,
        confidence: healthy.metadata?.confidence,
        guardian: healthy.metadata?.guardian,
        skills: healthy.skills?.slice(0, 6) || [],
      },
      qaPdf: {
        ...qaPdf,
      },
      qaPdfParser: {
        ...qaPdfParser,
      },
      qaPdfDirect: directPdfCheck,
      recovered: {
        name: recovered.personalDetails?.name,
        parsingMethod: recovered.metadata?.parsingMethod,
        confidence: recovered.metadata?.confidence,
        guardian: recovered.metadata?.guardian,
        warnings: recovered.metadata?.warnings || [],
      },
      actionText: {
        name: actionText.personalDetails?.name,
        email: actionText.personalDetails?.email,
        parsingMethod: actionText.metadata?.parsingMethod,
        confidence: actionText.metadata?.confidence,
        guardian: actionText.metadata?.guardian,
      },
      actionPdf: {
        ...actionPdf,
      },
      actionPdfWithPreflight: {
        ...actionPdfWithPreflight,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown diagnostics failure";
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
