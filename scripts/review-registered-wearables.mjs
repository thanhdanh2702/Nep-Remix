import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const tag = process.argv[2] ?? 'pilot';
const catalog = JSON.parse(await readFile('src/content/studio.json', 'utf8'));
const ids = process.argv.slice(3);
const selected = catalog.garments.filter(g => !ids.length || ids.includes(g.id));
const folder = 'artifacts/wearables/remake-2026-10-10/' + tag;
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const samples = [], errors = [];
try {
  for (const hair of ['long', 'bob']) {
    const page = await browser.newPage({ viewport: { width: 1672, height: 941 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
    await page.goto(process.env.QA_BASE_URL ?? 'http://localhost:3000');
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
    await page.evaluate(({ catalog, hair }) => {
      const key = 'tiem-may-nep-save-v1', envelope = JSON.parse(localStorage.getItem(key));
      const state = envelope.tree.nodes[envelope.tree.headId].snapshot;
      state.closet.unlockedGarmentIds = catalog.garments.map(g => g.id);
      state.closet.unlockedAccessoryIds = catalog.accessories.map(a => a.id);
      state.profile.avatarPreset = hair === 'bob' ? 'an-bob-default' : 'an-default';
      localStorage.setItem(key, JSON.stringify(envelope));
    }, { catalog, hair });
    await page.reload();
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
    await page.getByRole('button', { name: 'Phòng phối đồ', exact: true }).first().click();
    const model = page.locator('#paperdoll');
    await expect(model).toHaveAttribute('data-ready', 'true');
    await page.evaluate(async () => document.fonts.ready);
    for (const garment of selected) {
      await page.getByRole('tab', { name: 'Màu vải', exact: true }).click();
      await page.getByRole('tab', { name: 'Áo dài', exact: true }).click();
      const index = catalog.garments.findIndex(g => g.id === garment.id);
      for (let n = 0; n < Math.floor(index / 4); n++) await page.getByRole('button', { name: 'Trang trang phục tiếp', exact: true }).click();
      await page.locator('.studio-book-catalog').getByRole('button', { name: garment.name, exact: true }).click();
      await expect(model).toHaveAttribute('data-outfit', new RegExp(garment.id));
      for (const color of ['default', 'Giấy dó', 'Đỏ son']) {
        if (color !== 'default') await page.getByRole('button', { name: color, exact: true }).click();
        for (const direction of ['down', 'left', 'up', 'right']) {
          if (direction === 'down') await page.getByRole('button', { name: 'Trước', exact: true }).click();
          if (direction === 'left') await page.getByRole('button', { name: 'Nghiêng', exact: true }).click();
          if (direction === 'up') await page.getByRole('button', { name: 'Sau', exact: true }).click();
          if (direction === 'right') {
            await page.getByRole('button', { name: 'Nghiêng', exact: true }).click();
            await expect(model).toHaveAttribute('data-direction', 'left');
            await page.getByRole('button', { name: 'Nghiêng', exact: true }).click();
          }
          await expect(model).toHaveAttribute('data-direction', direction);
          await expect(model).toHaveAttribute('data-ready', 'true');
          await expect(model).toHaveAttribute('data-garment-layer', 'assets/garments/' + garment.id + '/' + garment.id + (direction === 'right' ? '--right.png' : '.png'));
          const src = await model.evaluate(c => c.toDataURL());
          const name = garment.id + '-' + hair + '-' + color + '-' + direction;
          await writeFile(folder + '/' + name + '.png', Buffer.from(src.split(',')[1], 'base64'));
          samples.push({ garment: garment.id, hair, color, direction, src });
          if (color === 'default' && hair === 'long') await page.screenshot({ path: folder + '/' + garment.id + '-' + direction + '-screen.png', animations: 'disabled' });
        }
      }
    }
    await page.close();
  }
  for (const garment of selected) {
    const group = samples.filter(s => s.garment === garment.id);
    const contact = await browser.newPage({ viewport: { width: 800, height: 2740 } });
    await contact.setContent('<style>body{margin:0;background:#fff1df;color:#2b2035;font:13px sans-serif}main{display:grid;grid-template-columns:repeat(4,200px)}figure{margin:0;padding:8px;text-align:center}img{width:176px;height:416px;image-rendering:pixelated}figcaption{height:24px}</style><main>' + group.map(s => '<figure><figcaption>' + s.hair + ' · ' + s.color + ' · ' + s.direction + '</figcaption><img src="' + s.src + '"></figure>').join('') + '</main>');
    await contact.locator('img').last().evaluate(i => i.decode());
    await contact.screenshot({ path: folder + '/' + garment.id + '-contact.png', fullPage: true });
    await contact.close();
  }
  await writeFile(folder + '/review.json', JSON.stringify({ errors, samples: samples.map(({ src, ...s }) => s) }, null, 2));
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Captured ' + samples.length + ' worn views: ' + folder);
} finally {
  await browser.close();
}
