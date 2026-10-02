import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Check the actual production pipeline: original bytes -> emitted PNG -> browser decoder.
const metadata = JSON.parse(await readFile('data/runtime-assets.json', 'utf8'));
const byHash = new Map(metadata.map(info => [info.sha256, info]));
const emitted = [];
for (const file of await readdir('dist/assets')) {
  if (!file.endsWith('.png')) continue;
  const bytes = await readFile(`dist/assets/${file}`);
  const hash = createHash('sha256').update(bytes).digest('hex');
  const info = byHash.get(hash);
  assert(info, `Production contains an unregistered image: ${file}`);
  emitted.push({ url: `/assets/${file}`, hash, width: info.width, height: info.height });
}
const emittedHashes = new Set(emitted.map(image => image.hash));
for (const info of metadata) assert(emittedHashes.has(info.sha256), `Not emitted: ${info.path}`);
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(process.env.QA_BASE_URL || 'http://127.0.0.1:4173');
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.locator('.scene canvas[data-position]').waitFor();
  const results = await page.evaluate(async images => {
    const decoded = [];
    // Bound concurrent decoding so the large An sheets do not exhaust browser memory.
    for (const expected of images) {
      const response = await fetch(expected.url);
      if (!response.ok) throw new Error(`${expected.url}: HTTP ${response.status}`);
      const bitmap = await createImageBitmap(await response.blob());
      decoded.push({ url: expected.url, width: bitmap.width, height: bitmap.height });
      bitmap.close();
    }
    return decoded;
  }, emitted);
  results.forEach((actual, index) => {
    assert.equal(actual.width, emitted[index].width, actual.url);
    assert.equal(actual.height, emitted[index].height, actual.url);
  });
  for (const [name, slug] of [['Phòng phối đồ', 'studio'], ['Tủ đồ', 'closet'], ['Bảo tàng', 'museum']]) {
    await page.getByRole('button', { name, exact: true }).first().click();
    await page.locator('.room-background img').waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('.room img')].every(img => img.complete && img.naturalWidth > 0));
    if (slug !== 'museum') await page.waitForFunction(() => {
      const canvas = document.querySelector('#paperdoll');
      return canvas && canvas.getContext('2d').getImageData(0, 0, 64, 96).data.some((value, index) => index % 4 === 3 && value);
    });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${slug}: mobile horizontal overflow`);
    await page.screenshot({ path: `artifacts/mobile-${slug}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: ${metadata.length} registered PNG assets preserved, emitted and decoded at their original dimensions; all mobile rooms have no horizontal overflow or console errors.`);
} finally {
  await browser.close();
}
