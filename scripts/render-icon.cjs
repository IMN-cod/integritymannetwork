/* eslint-disable @typescript-eslint/no-require-imports */
// Builds the official IMN icon by masking the supplied photo (Icon Main.jpeg)
// inside a shield shape on a rounded black background, in monochrome.
// Outputs SVG (vector wrapper around embedded PNG) + 128/192/256/512/1024 PNGs.

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'Icon Main.jpeg');
const OUT_DIR = path.join(ROOT, 'public', 'images');
const SIZES = [128, 192, 256, 512, 1024];
const CANVAS = 1024;

// Shield path inside a 1024x1024 viewBox (heater shield)
const SHIELD_PATH = `M 188 198 Q 188 186 200 186 L 824 186 Q 836 186 836 198 L 836 558 Q 836 762 686 868 Q 600 930 512 956 Q 424 930 338 868 Q 188 762 188 558 Z`;

// Bounding box of the shield (for sizing the photo fill)
const SHIELD_BOX = { x: 188, y: 186, w: 648, h: 770 };

(async () => {
  // 1) Original-color photo sized to fully cover the shield bbox
  const mono = await sharp(SRC)
    .resize(SHIELD_BOX.w, SHIELD_BOX.h, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();

  // 2) Shield-shaped mask (white on transparent), sized to bbox
  const maskSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SHIELD_BOX.w}" height="${SHIELD_BOX.h}" viewBox="0 0 ${SHIELD_BOX.w} ${SHIELD_BOX.h}">` +
      `<path transform="translate(${-SHIELD_BOX.x},${-SHIELD_BOX.y})" d="${SHIELD_PATH}" fill="#ffffff"/>` +
    `</svg>`
  );

  // 3) Apply shield mask to monochrome photo
  const maskedShield = await sharp(mono)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 4) Base canvas: rounded black square
  const canvasSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">` +
      `<rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" rx="180" ry="180" fill="#0A0A0A"/>` +
    `</svg>`
  );

  // Shield outline overlay
  const outlineSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">` +
      `<path d="${SHIELD_PATH}" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/>` +
    `</svg>`
  );

  const full = await sharp(canvasSvg)
    .composite([
      { input: maskedShield, top: SHIELD_BOX.y, left: SHIELD_BOX.x },
      { input: outlineSvg, top: 0, left: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  // 5) Write PNGs at all sizes
  for (const s of SIZES) {
    const out = path.join(OUT_DIR, `imn-icon-hand-torch-${s}.png`);
    await sharp(full).resize(s, s, { fit: 'contain' }).png({ compressionLevel: 9 }).toFile(out);
    console.log('wrote', out);
  }

  // 6) SVG wrapper embedding the 1024 PNG
  const b64 = full.toString('base64');
  const svgWrapper =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}">\n` +
    `  <title>Integrity Man Network</title>\n` +
    `  <image href="data:image/png;base64,${b64}" x="0" y="0" width="${CANVAS}" height="${CANVAS}"/>\n` +
    `</svg>\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'imn-icon-hand-torch.svg'), svgWrapper);
  console.log('wrote', path.join(OUT_DIR, 'imn-icon-hand-torch.svg'));
})().catch((e) => { console.error(e); process.exit(1); });
