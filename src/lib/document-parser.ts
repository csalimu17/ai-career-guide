import 'server-only';

// This library provides multi-format document processing with native and cloud-based OCR.
// Optimized for CV extraction in the AI Career Guide.
import type { ParsedDocument } from '@/types/cv';
import { extractPdfText } from '@/lib/pdf-text';
import { fetchDocumentBuffer } from '@/lib/server-document-source';

function normalizeExtractedText(text: string): string {
  if (!text) return "";

  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/â€¢/g, "•")
    .replace(/[\u2022\u25CF\u25E6]/g, "•")
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢|Ã¢â‚¬Â¢|â€¢|â—|â—¦/g, "-")
    .replace(/[\u2022\u25CF\u25E6]/g, "-")
    .replace(/(?:\b[A-Za-z]\s+){2,}[A-Za-z]\b/g, (match) => match.replace(/\s+/g, ""))
    .replace(/^\s*-\s*/gm, "- ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function parseDocument(fileUri: string, mimeType: string, storagePath?: string): Promise<ParsedDocument> {
  console.log(`[DocumentParser] Initializing extraction for MIME: ${mimeType}`);
  
  // 1. Fetch Buffer for Local Extraction
  let buffer: Buffer;
  try {
    buffer = await fetchDocumentBuffer({ cvDataUri: fileUri, cvMimeType: mimeType, storagePath });
  } catch (err) {
    console.error('[DocumentParser] Buffer fetch failed:', err);
    return { rawText: "", method: 'fallback', isScanned: false };
  }

  // 3. Native & Local Extractors
  try {
    let result: ParsedDocument;

    if (mimeType === 'application/pdf') {
      result = await parsePdf(buffer);
      // For scanned PDFs, skip local OCR on raw PDF bytes and let the extraction guardian retry with safer strategies.
      if (result.rawText.trim().length < 150) {
        console.log("[DocumentParser] PDF appears scanned. Skipping local OCR for PDF buffer and marking as scanned.");
        result = {
          rawText: result.rawText,
          method: result.rawText.trim().length ? result.method : 'fallback',
          isScanned: true,
        };
      }
    } 
    else if (mimeType.includes('officedocument.wordprocessingml') || mimeType.includes('msword')) {
      result = await parseDocx(buffer);
    } 
    else if (mimeType.startsWith('image/')) {
      result = await parseImageWithOcr(buffer);
    } 
    else {
      // Handle plain text / RTF
      result = {
        rawText: normalizeExtractedText(buffer.toString('utf-8')),
        method: 'native',
        isScanned: false
      };
    }

    // Final quality check
    if (result.rawText.length < 100) {
       console.log(`[DocumentParser] Native extraction returned weak results (${result.rawText.length} chars). Attempting Python robust pipeline...`);
       try {
         const extension = mimeType === 'application/pdf' ? '.pdf' : 
                          mimeType.includes('word') ? '.docx' : '.png';
         const { parseBufferWithPython } = await import('@/lib/python-parser');
         const pythonResult = await parseBufferWithPython(buffer, extension);
         if (pythonResult?.rawText && pythonResult.rawText.length > result.rawText.length) {
           console.log(`[DocumentParser] Python pipeline recovered more text (${pythonResult.rawText.length} chars).`);
           return {
             rawText: pythonResult.rawText,
             method: 'python-robust',
             isScanned: result.isScanned // Keep scanned status from original check if relevant
           };
         }
       } catch (err) {
         console.warn("[DocumentParser] Python fallback failed:", err);
       }
    }

    if (result.rawText.length < 10) {
       console.warn("[DocumentParser] All extraction layers failed to find useful text.");
       return { ...result, method: 'fallback' };
    }

    return result;

  } catch (error) {
    console.error('[DocumentParser] Fatal extraction error:', error);
    return { rawText: "", method: 'fallback', isScanned: false };
  }
}

/**
 * Score text quality based on recruitment hallmarks (Names, Emails, Dates, Section Titles).
 */
export function scoreTextQuality(text: string): number {
  if (!text || text.length < 50) return 0.1;
  let score = 0.2; // Base
  
  // 1. Entity Detection (Email, Phone, Names)
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) score += 0.2;
  
  // 2. Structural Marker Detection (Experience, Education, etc.)
  const markers = ['experience', 'education', 'professional', 'skills', 'projects', 'summary', 'history', 'employment'];
  const foundMarkers = markers.filter(m => new RegExp(m, 'i').test(text));
  score += Math.min(foundMarkers.length * 0.05, 0.3);

  // 3. Garbled Text Detection (High non-alphanumeric ratio)
  const alphaChars = text.replace(/[^a-zA-Z]/g, '').length;
  const ratio = alphaChars / text.length;
  if (ratio < 0.4) score -= 0.3; // Likely garbled or math/code-heavy, not a clean resume

  // 4. Length Consistency
  if (text.length > 500) score += 0.1;
  if (text.length > 1500) score += 0.1;

  return Math.max(Math.min(score, 1.0), 0);
}

/**
 * Explicit rules for location extraction based on structural layout.
 */
export function extractLocation(text: string): string {
  if (!text) return "";
  
  const lines = text
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean)
    .slice(0, 12);

  for (const line of lines) {
    if (
      line.length < 60 &&
      !/@/.test(line) &&
      !/\d{7,}/.test(line) &&
      !/[.!?]$/.test(line)
    ) {
      const hasComma = line.includes(",");
      const looksLikePlace = /\b(london|manchester|birmingham|uk|united kingdom|city|county|sf|ny|ca|new york|california)\b/i.test(line);
      if (hasComma || looksLikePlace) return line;
    }
  }

  return "";
}


async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const text = normalizeExtractedText(await extractPdfText(buffer));

    return {
      rawText: text,
      method: 'native',
      isScanned: text.length < 100
    };
  } catch (e) {
    console.warn("[LocalPDF] Worker-free PDF parsing failed. Falling back to OCR approach.", e);
    return { rawText: "", method: 'fallback', isScanned: true };
  }
}

async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    const text = normalizeExtractedText(result.value || "");
    
    // If a DOCX is just images/tables that mammoth can't see
    if (text.length < 50) {
        console.log("[LocalDOCX] Almost no text. Rerouting to Vision...");
        return { rawText: "", method: 'fallback', isScanned: true };
    }

    return { rawText: text, method: 'native', isScanned: false };
  } catch (e) {
    console.warn("[LocalDOCX] Parse error:", e);
    return { rawText: "", method: 'fallback', isScanned: true };
  }
}

async function parseImageWithOcr(buffer: Buffer): Promise<ParsedDocument> {
  let worker: any = null;
  try {
    const { createWorker } = await import('tesseract.js');
    console.log("[OCR] Initializing Tesseract Worker...");
    
    // Add a race condition to prevent total hang
    const ocrPromise = (async () => {
      worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(buffer);
      await worker.terminate();
      worker = null;
      return text;
    })();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("OCR Timeout")), 45000)
    );

    const text = await Promise.race([ocrPromise, timeoutPromise]) as string;
    
    return { 
      rawText: normalizeExtractedText(text || ""), 
      method: 'ocr', 
      isScanned: true 
    };
  } catch (e) {
    console.error("[OCR] Tesseract failed or timed out:", e);
    if (worker) await worker.terminate().catch(() => {});
    return { rawText: "", method: 'fallback', isScanned: true };
  }
}
