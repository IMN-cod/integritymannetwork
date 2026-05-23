import sharp from "sharp";
import { existsSync, unlinkSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "IMN Official Icon.jpeg");

const jobs = [
  // Next.js App Router favicon (browser tab)
  { out: resolve(root, "src/app/icon.png"),        size: 48  },
  // Apple touch icon
  { out: resolve(root, "src/app/apple-icon.png"),  size: 180 },
  // Public PWA / manifest icons (keep original filenames)
  { out: resolve(root, "public/images/imn-icon-hand-torch-128.png"),  size: 128  },
  { out: resolve(root, "public/images/imn-icon-hand-torch-192.png"),  size: 192  },
  { out: resolve(root, "public/images/imn-icon-hand-torch-256.png"),  size: 256  },
  { out: resolve(root, "public/images/imn-icon-hand-torch-512.png"),  size: 512  },
  { out: resolve(root, "public/images/imn-icon-hand-torch-1024.png"), size: 1024 },
];

for (const { out, size } of jobs) {
  await sharp(src)
    .resize(size, size, { fit: "cover" })
    .png({ quality: 100 })
    .toFile(out);
  console.log(`✓ ${size}x${size} → ${out.replace(root, "")}`);
}

// Remove the old oversized SVG icon (replaced by icon.png above)
const oldSvg = resolve(root, "src/app/icon.svg");
if (existsSync(oldSvg)) {
  unlinkSync(oldSvg);
  console.log("✓ Removed src/app/icon.svg");
}

console.log("\nAll icons generated.");
