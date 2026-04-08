import "server-only";

import { normalizeRecoverableText } from "@/lib/resume-text-recovery";
import { reconstructPdfTextFromItems } from "@/lib/pdf-layout-text";

/**
 * Utility to import CommonJS modules that might not be correctly handled by Turbopack/Next.js
 */
const dynamicImport = new Function("specifier", "return import(specifier);");

async function extractWithPdfParse(buffer: Buffer | Uint8Array) {
  try {
    const pdfParseModule = await dynamicImport("pdf-parse");
    // Some versions of pdf-parse export a function, others an object with PDFParse class
    const PDFParse = pdfParseModule.PDFParse || pdfParseModule.default?.PDFParse;
    
    if (!PDFParse && typeof pdfParseModule.default === 'function') {
      // Fallback to standard pdf-parse function if PDFParse class is missing
      const data = await pdfParseModule.default(Buffer.from(buffer));
      return normalizeRecoverableText(data.text || "");
    }

    if (!PDFParse) {
      throw new Error("Could not find PDFParse class or default function in pdf-parse module");
    }

    const data = Buffer.isBuffer(buffer) ? new Uint8Array(buffer) : buffer;
    const parser = new PDFParse({
      data,
      useWorkerFetch: false,
    });

    try {
      const result = await parser.getText({
        lineEnforce: true,
        itemJoiner: " ",
        pageJoiner: "\n\n",
      });

      return normalizeRecoverableText(result.text || "");
    } finally {
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
    }
  } catch (error) {
    console.warn("[PDFText] extractWithPdfParse failed:", error);
    throw error;
  }
}

function ensurePdfJsPolyfills() {
  if (typeof globalThis.DOMMatrix !== 'undefined' && typeof globalThis.ImageData !== 'undefined') {
    return;
  }

  try {
    const canvas = (eval("require") as NodeRequire)("@napi-rs/canvas") as any;

    if (typeof globalThis.DOMMatrix === 'undefined' && canvas.DOMMatrix) {
      globalThis.DOMMatrix = canvas.DOMMatrix;
    }
    if (typeof globalThis.ImageData === 'undefined' && canvas.ImageData) {
      globalThis.ImageData = canvas.ImageData;
    }
    if (typeof globalThis.Path2D === 'undefined' && canvas.Path2D) {
      globalThis.Path2D = canvas.Path2D;
    }
  } catch (error) {
    console.warn("[PDFText] Canvas polyfill unavailable for pdfjs fallback.", error);
  }
}

async function extractWithPdfJs(buffer: Buffer | Uint8Array) {
  ensurePdfJsPolyfills();
  
  // Use a stable import for pdfjs-dist
  const pdfjs = await dynamicImport("pdfjs-dist/legacy/build/pdf.mjs");
  
  const data = Buffer.isBuffer(buffer) ? new Uint8Array(buffer) : buffer;
  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,
    useWorkerFetch: false,
    isEvalSupported: false,
  });

  const document = await loadingTask.promise;

  try {
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = reconstructPdfTextFromItems(content.items || []);

      pages.push(pageText);
    }

    return normalizeRecoverableText(pages.join("\n\n"));
  } finally {
    await document.destroy();
  }
}

export async function extractPdfText(buffer: Buffer | Uint8Array): Promise<string> {
  let bestText = "";
  let parseError: unknown = null;

  // Strategy 1: pdf-parse (Fastest)
  try {
    const text = await extractWithPdfParse(buffer);
    if (text.trim().length >= 100) {
      return text;
    }
    bestText = text;
  } catch (error) {
    parseError = error;
    console.warn("[PDFText] pdf-parse stage failed, trying pdfjs fallback.");
  }

  // Strategy 2: pdfjs-dist (More robust for complex layouts)
  try {
    const text = await extractWithPdfJs(buffer);
    if (text.trim().length > bestText.trim().length) {
      bestText = text;
    }
  } catch (error) {
    console.warn("[PDFText] pdfjs stage failed.", error);
    // If both failed and we have no text, rethrow the original error or the new one
    if (!bestText.trim() && parseError) {
      throw parseError;
    }
  }

  return bestText;
}
