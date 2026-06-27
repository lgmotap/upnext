/**
 * Converts horizontal logo source (JPEG from remove.bg) to true RGBA PNG.
 * Keys out near-black and near-white backgrounds.
 * Run: npx tsx scripts/process-logo-transparent.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const root = join(import.meta.dirname, "..");
const source = join(root, "assets/brand/horizontal-source.jpg");

function keyBackground(data: Buffer) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const isBlack = r <= 30 && g <= 30 && b <= 30;
    const isWhite = r >= 235 && g >= 235 && b >= 235;
    if (isBlack || isWhite) {
      data[i + 3] = 0;
    }
  }
}

async function toTransparentPng(inputPath: string, outputPath: string) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  keyBackground(data);

  const out = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  writeFileSync(outputPath, out);
  const meta = await sharp(out).metadata();
  console.log(`✓ ${outputPath} (${meta.width}x${meta.height}, alpha: ${meta.hasAlpha})`);
}

async function main() {
  readFileSync(source);
  await toTransparentPng(source, join(root, "public/brand/logo-horizontal.png"));
  await toTransparentPng(source, join(root, "public/brand/logo-horizontal-compact.png"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
