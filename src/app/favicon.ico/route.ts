import path from "path";
import { readFile } from "fs/promises";

export const runtime = "nodejs";

export async function GET() {
  const file = await readFile(path.join(process.cwd(), "public", "favicon.png"));

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
