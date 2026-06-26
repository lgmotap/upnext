/**
 * Generates favicon.ico, app icons, and OG image from assets/brand/icon.svg.
 * Run: npx tsx scripts/generate-brand-icons.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const root = join(import.meta.dirname, "..");
const svgPath = join(root, "assets/brand/icon.svg");
const svg = readFileSync(svgPath);

async function png(size: number) {
  return sharp(svg).resize(size, size).png().toBuffer();
}

async function main() {
  const [icon16, icon32, icon180, icon512, ogBase] = await Promise.all([
    png(16),
    png(32),
    png(180),
    png(512),
    sharp(svg).resize(240, 240).png().toBuffer(),
  ]);

  const ico = await toIco([icon16, icon32], { resize: true });

  writeFileSync(join(root, "app/favicon.ico"), ico);
  writeFileSync(join(root, "app/icon.png"), icon32);
  writeFileSync(join(root, "app/apple-icon.png"), icon180);
  writeFileSync(join(root, "public/icon-512.png"), icon512);

  const og = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 247, g: 245, b: 239, alpha: 1 },
    },
  })
    .composite([
      { input: ogBase, top: 120, left: 80 },
      {
        input: Buffer.from(
          `<svg width="720" height="200" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="72" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="700" fill="#15191b">BookedFox</text>
            <text x="0" y="140" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="500" fill="#47514c">Online booking &amp; business software for home services</text>
          </svg>`,
        ),
        top: 200,
        left: 360,
      },
    ])
    .png()
    .toBuffer();

  writeFileSync(join(root, "app/opengraph-image.png"), og);
  writeFileSync(join(root, "public/og-image.png"), og);

  console.log("Generated app/favicon.ico, app/icon.png, app/apple-icon.png, app/opengraph-image.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
