import path from "path";
import { readFile } from "fs/promises";

export const runtime = "nodejs";
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default async function AppleIcon() {
  const file = await readFile(path.join(process.cwd(), "public", "app-install-apple-180.png"));

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
