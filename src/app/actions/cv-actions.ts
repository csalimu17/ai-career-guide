"use server";

import type { CvDataExtractionOutput } from "@/types/cv";
import { runCvExtractionPipeline } from "@/lib/extraction-service";

export async function extractCvAction(data: {
  cvDataUri: string;
  cvMimeType: string;
  cvRawText?: string;
  userId?: string;
  storagePath?: string;
}): Promise<CvDataExtractionOutput> {
  return runCvExtractionPipeline(data);
}
