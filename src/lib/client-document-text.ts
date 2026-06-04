import { reconstructPdfTextFromItems } from "@/lib/pdf-layout-text";

let pdfWorkerConfigured = false;
const PDFJS_DIST_VERSION = "4.10.38";

async function extractPdfTextInBrowser(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  if (!pdfWorkerConfigured) {
    // Use the published worker bundle directly so Next does not try to statically bundle the ESM worker file.
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_DIST_VERSION}/legacy/build/pdf.worker.min.mjs`;
    pdfWorkerConfigured = true;
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const document = await pdfjs.getDocument({ data }).promise;

  try {
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = reconstructPdfTextFromItems(content.items);

      pages.push(pageText);
      page.cleanup();
    }

    return pages.join("\n\n").trim();
  } finally {
    await document.destroy();
  }
}

async function extractDocxTextInBrowser(file: File) {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

export async function extractClientDocumentText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const mimeType = file.type || "";

  try {
    if (mimeType === "text/plain" || name.endsWith(".txt")) {
      return (await file.text()).trim();
    }

    if (mimeType === "application/pdf" || name.endsWith(".pdf")) {
      return await extractPdfTextInBrowser(file);
    }

    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword" ||
      name.endsWith(".docx") ||
      name.endsWith(".doc")
    ) {
      return await extractDocxTextInBrowser(file);
    }
  } catch (error) {
    console.warn("Client-side document text extraction failed:", error);
  }

  return "";
}
