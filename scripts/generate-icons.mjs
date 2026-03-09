#!/usr/bin/env node
/**
 * generate-icons.mjs
 *
 * icon.png (root) を元に、Tauri / Vector / Microsoft Store 用の
 * アイコンアセットをすべて生成するスクリプト。
 *
 * 使い方:
 *   npm run generate:icons
 *
 * 依存:
 *   - sharp (npm devDependency)
 *   - @tauri-apps/cli (npm devDependency) ← .icns / .ico 生成に使用
 */

import sharp from 'sharp';
import { execSync } from 'child_process';
import { mkdirSync, rmSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'icon.png');

// ── 入力チェック ───────────────────────────────────────────────────────────────
if (!existsSync(SOURCE)) {
  console.error('Error: icon.png not found at project root.');
  process.exit(1);
}

const meta = await sharp(SOURCE).metadata();
const { width, height } = meta;
console.log(`Source: icon.png (${width}x${height})`);

// ── 正方形クロップ ─────────────────────────────────────────────────────────────
// icon.png が正方形でない場合は中央クロップで正方形を切り出す
const side = Math.min(width, height);
const left = Math.floor((width - side) / 2);
const top = Math.floor((height - side) / 2);

const squareSrc = sharp(SOURCE).extract({ left, top, width: side, height: side });
console.log(`Center crop: ${side}x${side} (offset: ${left},${top})\n`);

// ── tauri icon で公式アイコン一式を生成 ────────────────────────────────────────
// .icns / .ico / 各 PNG / iOS / Android / APPX ロゴ をすべて生成する
console.log('--- Tauri icons (tauri icon) ---');

// tauri icon は正方形 PNG を入力として受け取る。
// icon.png が非正方形の場合は一時ファイルを経由する。
const needsTemp = width !== height;
const tauriInput = needsTemp
  ? path.join(ROOT, '.icon-square-tmp.png')
  : SOURCE;

if (needsTemp) {
  await squareSrc.clone().png().toFile(tauriInput);
  console.log(`Temp square icon: ${tauriInput}`);
}

try {
  execSync(`npx tauri icon "${tauriInput}"`, { cwd: ROOT, stdio: 'inherit' });
} finally {
  if (needsTemp && existsSync(tauriInput)) {
    rmSync(tauriInput);
  }
}

console.log();

// ── Vector 公開用アイコン ──────────────────────────────────────────────────────
console.log('--- Vector assets (assets/vector/) ---');
const vectorDir = path.join(ROOT, 'assets', 'vector');
mkdirSync(vectorDir, { recursive: true });

for (const size of [512, 256, 128, 64]) {
  const outPath = path.join(vectorDir, `icon-${size}.png`);
  await squareSrc.clone().resize(size, size).png().toFile(outPath);
  console.log(`  assets/vector/icon-${size}.png`);
}
console.log();

// ── Microsoft Store 用アセット ────────────────────────────────────────────────
console.log('--- Microsoft Store assets (assets/microsoft-store/) ---');
const storeDir = path.join(ROOT, 'assets', 'microsoft-store');
mkdirSync(storeDir, { recursive: true });

// 正方形アイコン各サイズ
const squareSizes = [
  { size: 32,  name: 'store-square-32x32' },
  { size: 44,  name: 'store-square-44x44' },
  { size: 50,  name: 'store-logo-50x50' },
  { size: 71,  name: 'store-square-71x71' },
  { size: 150, name: 'store-square-150x150' },
  { size: 256, name: 'store-square-256x256' },
  { size: 310, name: 'store-square-310x310' },
];
for (const { size, name } of squareSizes) {
  const outPath = path.join(storeDir, `${name}.png`);
  await squareSrc.clone().resize(size, size).png().toFile(outPath);
  console.log(`  assets/microsoft-store/${name}.png`);
}

// ワイドタイル 310x150: アプリ背景色でパディング
const WIDE_W = 310;
const WIDE_H = 150;
const ICON_IN_WIDE = 110; // 中央に配置するアイコンサイズ
const BG = { r: 15, g: 17, b: 23, alpha: 1 }; // #0F1117

const iconForWide = await squareSrc.clone()
  .resize(ICON_IN_WIDE, ICON_IN_WIDE)
  .png()
  .toBuffer();

const wideOut = path.join(storeDir, 'store-wide-310x150.png');
await sharp({
  create: { width: WIDE_W, height: WIDE_H, channels: 4, background: BG },
})
  .composite([{
    input: iconForWide,
    left: Math.floor((WIDE_W - ICON_IN_WIDE) / 2),
    top:  Math.floor((WIDE_H - ICON_IN_WIDE) / 2),
  }])
  .png()
  .toFile(wideOut);
console.log(`  assets/microsoft-store/store-wide-310x150.png`);

console.log('\nAll icons generated successfully.');
