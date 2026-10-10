import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const revision = process.argv[2] ?? 'v1';
const output = 'artifacts/design-options/implementation-c-lb1/' + revision;
await mkdir(output, { recursive: true });
const catalog = JSON.parse(await readFile('src/content/studio.json', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1672, height: 941 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.status() >= 400 && !r.url().includes('/api/')) errors.push(r.status() + ' ' + r.url()); });
await page.goto(process.env.QA_BASE_URL ?? 'http://localhost:3000');
await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
await page.getByRole('button', { name: 'Phòng phối đồ', exact: true }).first().click();
const ready = async () => {
  await page.locator('#paperdoll').waitFor();
  await page.waitForFunction(() => document.querySelector('#paperdoll')?.getAttribute('data-ready') === 'true');
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(resolve => { i.onload = resolve; i.onerror = resolve; }))); });
};
const shot = async name => {
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(resolve => { i.onload = resolve; i.onerror = resolve; }))); });
  await page.screenshot({ path: output + '/' + name + '.png', animations: 'disabled' });
};
await ready();
await shot('studio-default');
// QA-only save: exercise every supplied garment without changing game unlock rules.
await page.evaluate(catalog => {
  const key = 'tiem-may-nep-save-v1', envelope = JSON.parse(localStorage.getItem(key));
  const tree = envelope.tree ?? envelope, state = tree.nodes[tree.headId].snapshot;
  state.closet.unlockedGarmentIds = catalog.garments.map(g => g.id);
  state.closet.unlockedAccessoryIds = catalog.accessories.map(a => a.id);
  localStorage.setItem(key, JSON.stringify(envelope));
}, catalog);
await page.reload();
await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
await page.getByRole('button', { name: 'Phòng phối đồ', exact: true }).first().click();
await ready();
await shot('studio-c-desktop');
await page.locator('.studio-book-catalog .wardrobe-card').nth(1).screenshot({ path: output + '/garment-card.png', animations: 'disabled' });
await page.getByRole('button', { name: 'Chụp Lookbook AI', exact: true }).click();
await page.locator('.lookbook-shell').waitFor();
await shot('lookbook-lb1-empty');
await page.getByRole('button', { name: 'Xem ảnh mẫu', exact: true }).click();
await shot('lookbook-lb1-sample');
const layout = await page.evaluate(() => ({
  viewport: [innerWidth, innerHeight],
  studioBook: (() => { const r = document.querySelector('.studio-book').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })(),
  album: (() => { const r = document.querySelector('.lookbook-shell').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })(),
  apertures: [...document.querySelectorAll('.lookbook-photo-aperture')].map(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }),
  overflow: document.documentElement.scrollWidth > innerWidth,
}));
await writeFile(output + '/review.json', JSON.stringify({ errors, layout }, null, 2));
console.log(JSON.stringify({ output, errors, layout }, null, 2));
await browser.close();
