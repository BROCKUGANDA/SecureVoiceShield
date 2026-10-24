import { mkdir, readFile, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

/**
 * Generate the PWA icons from public/logo.svg (14, section 10.1).
 *
 *   bun run scripts/generate-icons.ts
 *
 * The manifest must point at files that exist: an icon URL that 404s breaks
 * the install prompt and the Lighthouse PWA audit. This script is the
 * reproducible source of the three PNGs the manifest links to:
 *
 *   public/icons/icon-192.png           — any purpose, transparent canvas
 *   public/icons/icon-512.png           — any purpose, transparent canvas
 *   public/icons/icon-512-maskable.png — emerald field, logo inside the
 *                                        80 % safe zone so a circular mask
 *                                        never clips the shield
 *
 * The logo keeps its own geometry; only the two flat fills are mapped onto
 * the KANGA palette (deep emerald badge, cream glyph) so the icon matches
 * the app icon and never drifts back to the generic grey of the source SVG.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "public", "logo.svg");
const OUT_DIR = path.join(ROOT, "public", "icons");

/** KANGA tokens (01) — the same values as src/app/globals.css. */
const EMERALD = "#12533f";
const CREAM = "#f0faf5";

/** Flat fills of the source logo, mapped onto the palette. */
const FILL_MAP: Record<string, string> = {
  "#2D2D2D": EMERALD,
  "#FFFFFF": CREAM,
  "#ffffff": CREAM,
};

/** The maskable safe zone is a circle of 80 % of the icon. */
const MASKABLE_SCALE = 0.6;

async function readLogo(): Promise<Buffer> {
  const raw = await readFile(SOURCE, "utf8");
  let svg = raw;
  for (const [from, to] of Object.entries(FILL_MAP)) {
    svg = svg.split(from).join(to);
  }
  return Buffer.from(svg, "utf8");
}

/** Rasterise the recoloured logo at `size` pixels square. */
function rasterise(svg: Buffer, size: number): sharp.Sharp {
  return sharp(svg, { density: 384 }).resize(size, size, { fit: "contain" });
}

async function writePng(file: string, pipeline: sharp.Sharp): Promise<void> {
  await pipeline.png({ compressionLevel: 9 }).toFile(file);
  const info = await stat(file);
  console.log(`${path.relative(ROOT, file)}  ${info.size} bytes`);
}

/** Read back the PNG header so a truncated file is caught here, not in CI. */
async function assertPng(file: string, expected: number): Promise<void> {
  const buf = await readFile(file);
  const signature = buf.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error(`${file} is not a PNG (signature ${signature})`);
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width !== expected || height !== expected) {
    throw new Error(`${file} is ${width}x${height}, expected ${expected}x${expected}`);
  }
  const meta = await sharp(file).metadata();
  if (meta.format !== "png" || meta.width !== expected || meta.height !== expected) {
    throw new Error(`${file} did not decode as a ${expected}x${expected} PNG`);
  }
  console.log(`  verified ${width}x${height} PNG`);
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  const svg = await readLogo();

  const icon192 = path.join(OUT_DIR, "icon-192.png");
  const icon512 = path.join(OUT_DIR, "icon-512.png");
  const maskable = path.join(OUT_DIR, "icon-512-maskable.png");

  await writePng(icon192, rasterise(svg, 192));
  await writePng(icon512, rasterise(svg, 512));

  // Maskable: the logo sits on an emerald field, padded well inside the
  // safe zone so a circle, a squircle or a rounded square all keep it whole.
  const inner = Math.round(512 * MASKABLE_SCALE);
  const logo = await rasterise(svg, inner).png().toBuffer();
  await writePng(
    maskable,
    sharp({
      create: { width: 512, height: 512, channels: 4, background: EMERALD },
    })
      .composite([{ input: logo, top: Math.round((512 - inner) / 2), left: Math.round((512 - inner) / 2) }])
      .png({ compressionLevel: 9 }),
  );

  await assertPng(icon192, 192);
  await assertPng(icon512, 512);
  await assertPng(maskable, 512);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
