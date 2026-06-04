import "server-only";

type DocumentSource = {
  cvDataUri: string;
  cvMimeType: string;
  storagePath?: string;
};

function decodeDataUri(data: string) {
  const base64Data = data.split(",")[1] || data;
  return Buffer.from(base64Data, "base64");
}

async function fetchHttpBuffer(fileUri: string, timeoutMs = 15000): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(fileUri, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Remote fetch failed with status ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchStorageBuffer(storagePath: string): Promise<Buffer> {
  const { storage } = await import("@/firebase/admin");
  const [buffer] = await storage.bucket().file(storagePath).download();
  return buffer;
}

export async function fetchDocumentBuffer(source: DocumentSource): Promise<Buffer> {
  if (source.storagePath) {
    return fetchStorageBuffer(source.storagePath);
  }

  if (source.cvDataUri.startsWith("http")) {
    return fetchHttpBuffer(source.cvDataUri);
  }

  return decodeDataUri(source.cvDataUri);
}

export async function resolveDocumentDataUri(source: DocumentSource): Promise<string> {
  if (!source.storagePath && !source.cvDataUri.startsWith("http")) {
    return source.cvDataUri.startsWith("data:")
      ? source.cvDataUri
      : `data:${source.cvMimeType};base64,${decodeDataUri(source.cvDataUri).toString("base64")}`;
  }

  const buffer = await fetchDocumentBuffer(source);
  return `data:${source.cvMimeType};base64,${buffer.toString("base64")}`;
}
