/**
 * Generates favicon.ico, app icons, and OG image from assets/brand/icon.png.
 * Run: npm run generate:icons
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const root = join(import.meta.dirname, "..");
const iconPath = join(root, "assets/brand/icon.png");
const horizontalLogoPath = join(root, "public/brand/logo-horizontal-compact.png");
const icon = readFileSync(iconPath);
const horizontalLogo = readFileSync(horizontalLogoPath);

async function pngFromIcon(size: number) {
  return sharp(icon).resize(size, size).png().toBuffer();
}

async function main() {
  const [icon16, icon32, icon180, icon512, logoForOg] = await Promise.all([
    pngFromIcon(16),
    pngFromIcon(32),
    pngFromIcon(180),
    pngFromIcon(512),
    sharp(horizontalLogo).resize(520, 130, { fit: "inside" }).png().toBuffer(),
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
      background: { r: 5, g: 26, b: 61, alpha: 1 },
    },
  })
    .composite([
      { input: logoForOg, top: 250, left: 340 },
      {
        input: Buffer.from(
          `<svg width="720" height="80" xmlns="http://www.w3.org/2000/svg">
            <text x="360" y="52" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="500" fill="#F6F8FB">Online booking &amp; business software for home services</text>
          </svg>`,
        ),
        top: 420,
        left: 240,
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
