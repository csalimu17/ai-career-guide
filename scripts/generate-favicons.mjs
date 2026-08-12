import { loadImage, createCanvas } from "@napi-rs/canvas";
import fs from "fs/promises";
import path from "path";

async function generateFavicons() {
  const sourcePath = path.join(process.cwd(), "public", "logo-compass-v3.png");
  console.log("Loading source image:", sourcePath);
  
  const img = await loadImage(sourcePath);
  console.log(`Original dimensions: ${img.width}x${img.height}`);

  const targets = [
    { name: "favicon.png", width: 64, height: 64 },
    { name: "brand-logo-favicon-192.png", width: 192, height: 192 },
    { name: "brand-logo-favicon-512.png", width: 512, height: 512 },
    { name: "app-install-icon-192.png", width: 192, height: 192 },
    { name: "app-install-icon-512.png", width: 512, height: 512 },
    { name: "app-install-apple-180.png", width: 180, height: 180 },
    { name: "apple-icon.png", width: 180, height: 180 },
    { name: "brand-resume-mark-256.webp", width: 256, height: 256 },
  ];

  for (const target of targets) {
    const canvas = createCanvas(target.width, target.height);
    const ctx = canvas.getContext("2d");

    // Enable high quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw image centered in square
    ctx.drawImage(img, 0, 0, target.width, target.height);

    const buffer = await canvas.toBuffer("image/png");
    const outPath = path.join(process.cwd(), "public", target.name);
    await fs.writeFile(outPath, buffer);
    console.log(`Generated ${target.name} (${target.width}x${target.height})`);
  }

  console.log("All favicons updated successfully!");
}

generateFavicons().catch(console.error);
