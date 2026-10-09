import { test, expect, type Locator, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// Every /api/ai/lookbook* call is answered here: no spec ever reaches Gemini.
const REASONS_RE = /ai_unavailable|rate_limited|safety_blocked|quota_exhausted|invalid_output/;
const SAVE_KEY = 'tiem-may-nep-save-v1';
const ANGLES = ['front', 'turn', 'back', 'detail'] as const;
type Angle = typeof ANGLES[number];
const LABEL: Record<Angle, string> = { front: 'Chính diện', turn: 'Ngoảnh lại', back: 'Sau lưng', detail: 'Cận cảnh' };
const garments = JSON.parse(readFileSync('src/content/studio.json', 'utf8')).garments as { id: string; name: string; culturalSummary: string }[];
const TU_THAN = garments.find(g => g.id === 'ao-tu-than')!;

// ---- tiny valid PNGs so every angle gets a different, decodable data URL ----
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf: Buffer) => { let c = 0xffffffff; for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0); body.copy(out, 4); out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}
function pngBuffer(r: number, g: number, b: number): Buffer {
  const header = Buffer.alloc(13); header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.from([0, r, g, b]))), chunk('IEND', Buffer.alloc(0))]);
}
const dataUrl = (r: number, g: number, b: number) => `data:image/png;base64,${pngBuffer(r, g, b).toString('base64')}`;
const IMG: Record<Angle, string> = { front: dataUrl(200, 30, 30), turn: dataUrl(30, 200, 30), back: dataUrl(30, 30, 200), detail: dataUrl(200, 200, 30) };
const RETRY_IMG = dataUrl(120, 40, 160);

// ---- SSE frames ----
const sse = (events: [string, unknown][]) => events.map(([type, data]) => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`).join('');
type AngleEvent = { status: 'error'; reason: string } | { status: 'done' };
function lookbookStream(plan: Partial<Record<Angle, AngleEvent>> = {}, opts: { done?: boolean; only?: Angle[] } = {}) {
  const ids = opts.only ?? [...ANGLES];
  const events: [string, unknown][] = [['start', { total: 4, cached: false }]];
  for (const id of ids) {
    const p = plan[id] ?? { status: 'done' as const };
    events.push(['angle', p.status === 'error' ? { id, status: 'error', reason: p.reason } : { id, status: 'done', image: IMG[id], ...(id === 'front' ? { heroToken: 'tok-front' } : {}) }]);
  }
  if (opts.done !== false) events.push(['done', { completed: ids.filter(id => (plan[id]?.status ?? 'done') === 'done').length }]);
  return sse(events);
}
const sseResponse = (body: string) => ({ status: 200, headers: { 'content-type': 'text/event-stream' }, body });

// ---- mock layer ----
type Body = Record<string, unknown>;
interface Handlers {
  stream?: (route: Route, body: Body) => Promise<void> | void;
  angle?: (route: Route, body: Body) => Promise<void> | void;
  check?: (route: Route, body: Body) => Promise<void> | void;
}
interface Mock { stream: Body[]; angle: Body[]; check: Body[]; all: string[] }
async function mockLookbook(page: Page, handlers: Handlers): Promise<Mock> {
  const mock: Mock = { stream: [], angle: [], check: [], all: [] };
  await page.route(/\/api\/ai\/lookbook(\/|$)/, async route => {
    const path = new URL(route.request().url()).pathname;
    const kind = path.endsWith('/angle') ? 'angle' : path.endsWith('/check') ? 'check' : 'stream';
    const body = (route.request().postDataJSON() ?? {}) as Body;
    mock.all.push(path);
    mock[kind].push(body);
    const handler = handlers[kind];
    if (handler) await handler(route, body);
    else await route.fulfill({ status: 500, json: { ok: false } }); // an unexpected call must not look like success
  });
  return mock;
}
const checkOk = (verdict: 'ok' | 'warn' | 'block', over: Body = {}) => (route: Route) => route.fulfill({
  json: { ok: true, data: { onePerson: true, faceVisible: true, fullBody: verdict === 'ok', looksAdult: true, verdict, ...over } }
});

// ---- page helpers ----
async function enterStudio(page: Page, opts: { gender?: 'male' } = {}) {
  const errors: string[] = [];
  // A stale dev server can hold the Vite HMR websocket port; those errors are environmental, not ours.
  page.on('pageerror', error => { if (!/24678|\[vite\]|WebSocket closed without opened/.test(error.message)) errors.push(error.message); });
  await page.goto('/');
  if (opts.gender) {
    // Game has no gender setting: edit the save the game itself wrote, then resume it.
    await page.getByRole('button', { name: 'Vào game', exact: true }).click();
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key) !== null, SAVE_KEY)).toBe(true);
    await page.evaluate(([key, gender]) => {
      const envelope = JSON.parse(localStorage.getItem(key)!);
      const tree = envelope.tree ?? envelope;
      tree.nodes[tree.headId].snapshot.profile.gender = gender;
      localStorage.setItem(key, JSON.stringify(envelope));
    }, [SAVE_KEY, opts.gender]);
    await page.reload();
  }
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.getByRole('button', { name: 'Phòng phối đồ', exact: true }).first().click();
  await expect(page.locator('#paperdoll')).toHaveAttribute('data-ready', 'true');
  return errors;
}
const opener = (page: Page) => page.getByRole('button', { name: 'Chụp Lookbook AI', exact: true });
const dialogOf = (page: Page) => page.getByRole('dialog', { name: 'Lookbook AI' });
async function openDialog(page: Page): Promise<Locator> {
  await opener(page).click();
  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  return dialog;
}
const slot = (dialog: Locator, id: Angle) => dialog.locator(`figure.lookbook-slot[data-angle="${id}"]`);
const captureBtn = (dialog: Locator, name = 'Chụp 4 ảnh') => dialog.getByRole('button', { name, exact: true });
const bodyText = (page: Page) => page.evaluate(() => document.body.innerText);

async function pickPerson(dialog: Locator) {
  await dialog.getByRole('button', { name: 'Ảnh của tôi', exact: true }).click();
  await dialog.locator('input[type=file]').first().setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: pngBuffer(10, 20, 30) });
  await expect(dialog.getByRole('img', { name: 'Ảnh của bạn' })).toBeVisible();
}

// ---- 1 ----
test('fictional happy path: no request on open, id-only body, 4 slots fill, story from the catalog', async ({ page }) => {
  const mock = await mockLookbook(page, { stream: route => route.fulfill(sseResponse(lookbookStream())) });
  const errors = await enterStudio(page);
  const dialog = await openDialog(page);
  expect(mock.all).toEqual([]);

  await captureBtn(dialog).click();
  await expect(dialog.locator('figure.lookbook-slot[data-status="done"]')).toHaveCount(4);
  expect(mock.stream).toHaveLength(1);
  const body = mock.stream[0];
  expect(Object.keys(body).sort()).toEqual(['accessoryIds', 'colorPalette', 'eventId', 'garmentId', 'mode', 'modelGender', 'moodId']);
  expect(body).toMatchObject({ mode: 'fictional', modelGender: 'female', garmentId: 'ao-tu-than', accessoryIds: [], eventId: 'dao_pho', moodId: 'pho-co' });
  expect(body.colorPalette).toEqual(expect.arrayContaining([expect.stringMatching(/^#[0-9a-f]{6}$/)]));
  expect((body.colorPalette as string[]).every(c => /^#[0-9a-f]{6}$/.test(c))).toBe(true);
  for (const id of ANGLES) await expect(slot(dialog, id).locator('img.lookbook-slot-img')).toHaveAttribute('src', IMG[id]);
  await expect(dialog.getByRole('button', { name: 'Lưu ảnh PNG', exact: true })).toBeVisible();
  await expect(page.locator('img.studio-ai-photo')).toHaveCount(4);
  await expect(dialog.getByRole('region', { name: 'Câu chuyện tà áo' })).toContainText(TU_THAN.culturalSummary);
  expect(errors).toEqual([]);
});

// ---- 2 ----
test('character gender male is sent as modelGender', async ({ page }) => {
  const mock = await mockLookbook(page, { stream: route => route.fulfill(sseResponse(lookbookStream())) });
  await enterStudio(page, { gender: 'male' });
  const dialog = await openDialog(page);
  await expect(dialog).toContainText('dáng nam');
  await captureBtn(dialog).click();
  await expect(dialog.locator('figure.lookbook-slot[data-status="done"]')).toHaveCount(4);
  expect(mock.stream[0]).toMatchObject({ mode: 'fictional', modelGender: 'male' });
});

// ---- 3 ----
test('personal mode is gated by photo, consent and a single server check', async ({ page }) => {
  const mock = await mockLookbook(page, { check: checkOk('ok'), stream: route => route.fulfill(sseResponse(lookbookStream())) });
  await enterStudio(page);
  const dialog = await openDialog(page);
  await dialog.getByRole('button', { name: 'Ảnh của tôi', exact: true }).click();
  await expect(captureBtn(dialog)).toBeDisabled();
  await pickPerson(dialog);
  const consent = dialog.getByRole('checkbox');
  await expect(consent).not.toBeChecked();
  await expect(captureBtn(dialog)).toBeDisabled();
  await page.waitForTimeout(400); // negative check: give a wrongly eager upload time to fire
  expect(mock.check).toHaveLength(0);

  const checked = page.waitForRequest(request => request.url().endsWith('/api/ai/lookbook/check'));
  await consent.check();
  await checked;
  await expect(dialog.getByText('Ảnh đạt: một người, thấy rõ mặt, toàn thân.')).toBeVisible();
  await expect(captureBtn(dialog)).toBeEnabled();
  expect(mock.check).toHaveLength(1);
  expect(Object.keys(mock.check[0])).toEqual(['personImage']);

  await captureBtn(dialog).click();
  await expect(dialog.locator('figure.lookbook-slot[data-status="done"]')).toHaveCount(4);
  expect(mock.check).toHaveLength(1);
  expect(mock.stream[0]).toMatchObject({ mode: 'personal', moodId: 'pho-co' });
  expect(String(mock.stream[0].personImage)).toMatch(/^data:image\/jpeg;base64,/);
});

// ---- 4 ----
test('check verdict block: adult-only message, capture stays disabled, switch back to the shop model', async ({ page }) => {
  const mock = await mockLookbook(page, { check: checkOk('block', { looksAdult: false }) });
  await enterStudio(page);
  const dialog = await openDialog(page);
  await pickPerson(dialog);
  await dialog.getByRole('checkbox').check();
  await expect(dialog.getByText('Tiệm chỉ nhận ảnh người lớn.')).toBeVisible();
  await expect(captureBtn(dialog)).toBeDisabled();
  expect(mock.stream).toHaveLength(0);
  await dialog.getByRole('button', { name: 'Dùng Người mẫu của tiệm', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Người mẫu của tiệm', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(captureBtn(dialog)).toBeEnabled();
  expect(mock.stream).toHaveLength(0);
});

// ---- 5 ----
test('check verdict warn: body-not-visible note, capture enabled', async ({ page }) => {
  await mockLookbook(page, { check: checkOk('warn') });
  await enterStudio(page);
  const dialog = await openDialog(page);
  await pickPerson(dialog);
  await dialog.getByRole('checkbox').check();
  await expect(dialog.getByText('dáng người sẽ được ước đoán')).toBeVisible();
  await expect(captureBtn(dialog)).toBeEnabled();
});

// ---- 6 ----
test('retry one angle: sends angle + hero + token, only that slot changes', async ({ page }) => {
  const mock = await mockLookbook(page, {
    stream: route => route.fulfill(sseResponse(lookbookStream({ detail: { status: 'error', reason: 'timeout' } }))),
    angle: route => route.fulfill({ json: { ok: true, data: { id: 'detail', image: RETRY_IMG } } })
  });
  await enterStudio(page);
  const dialog = await openDialog(page);
  await captureBtn(dialog).click();
  await expect(slot(dialog, 'detail').locator('.lookbook-slot-error')).toContainText('Chụp hơi lâu');
  await dialog.getByRole('button', { name: 'Chụp lại góc Cận cảnh', exact: true }).click();
  await expect(slot(dialog, 'detail')).toHaveAttribute('data-status', 'done');
  expect(mock.angle).toHaveLength(1);
  expect(mock.angle[0]).toMatchObject({ angle: 'detail', heroImage: IMG.front, heroToken: 'tok-front', mode: 'fictional', moodId: 'pho-co' });
  expect(mock.angle[0].noCache).toBeUndefined();
  await expect(slot(dialog, 'detail').locator('img.lookbook-slot-img')).toHaveAttribute('src', RETRY_IMG);
  for (const id of ['front', 'turn', 'back'] as const) await expect(slot(dialog, id).locator('img.lookbook-slot-img')).toHaveAttribute('src', IMG[id]);
  expect(mock.stream).toHaveLength(1);
});

// ---- 7 ----
test('two retries in flight do not overwrite each other', async ({ page }) => {
  const held: Route[] = [];
  const mock = await mockLookbook(page, {
    stream: route => route.fulfill(sseResponse(lookbookStream({ turn: { status: 'error', reason: 'ai_unavailable' }, detail: { status: 'error', reason: 'timeout' } }))),
    angle: route => { held.push(route); } // hold: answered below, in reverse order
  });
  await enterStudio(page);
  const dialog = await openDialog(page);
  await captureBtn(dialog).click();
  await expect(slot(dialog, 'turn')).toHaveAttribute('data-status', 'error');
  await expect(slot(dialog, 'detail')).toHaveAttribute('data-status', 'error');
  await dialog.getByRole('button', { name: 'Chụp lại góc Ngoảnh lại', exact: true }).click();
  await dialog.getByRole('button', { name: 'Chụp lại góc Cận cảnh', exact: true }).click();
  await expect.poll(() => held.length).toBe(2);
  expect(mock.angle.map(b => b.angle)).toEqual(['turn', 'detail']);
  await expect(slot(dialog, 'turn')).toHaveAttribute('data-status', 'generating');
  await expect(slot(dialog, 'detail')).toHaveAttribute('data-status', 'generating');

  const turnImage = dataUrl(1, 2, 3), detailImage = dataUrl(4, 5, 6);
  await held[1].fulfill({ json: { ok: true, data: { id: 'detail', image: detailImage } } }); // detail answers first
  await expect(slot(dialog, 'detail').locator('img.lookbook-slot-img')).toHaveAttribute('src', detailImage);
  await expect(slot(dialog, 'turn')).toHaveAttribute('data-status', 'generating');
  await held[0].fulfill({ json: { ok: true, data: { id: 'turn', image: turnImage } } });
  await expect(slot(dialog, 'turn').locator('img.lookbook-slot-img')).toHaveAttribute('src', turnImage);
  await expect(slot(dialog, 'detail').locator('img.lookbook-slot-img')).toHaveAttribute('src', detailImage);
  for (const id of ['front', 'back'] as const) await expect(slot(dialog, id).locator('img.lookbook-slot-img')).toHaveAttribute('src', IMG[id]);
});

// ---- 8 ----
test('stream that ends without "done": unfinished slots become retryable errors, none keeps spinning', async ({ page }) => {
  await mockLookbook(page, { stream: route => route.fulfill(sseResponse(lookbookStream({}, { only: ['front'], done: false }))) });
  await enterStudio(page);
  const dialog = await openDialog(page);
  await captureBtn(dialog).click();
  await expect(slot(dialog, 'front')).toHaveAttribute('data-status', 'done');
  for (const id of ['turn', 'back', 'detail'] as const) {
    await expect(slot(dialog, id)).toHaveAttribute('data-status', 'error');
    await expect(dialog.getByRole('button', { name: `Chụp lại góc ${LABEL[id]}`, exact: true })).toBeEnabled();
  }
  await expect(dialog.locator('figure.lookbook-slot[data-status="generating"], figure.lookbook-slot[data-status="queued"]')).toHaveCount(0);
});

// ---- 9 + 10 ----
test('daily quota: friendly sentence in every slot, capture locked, pixel panel kept, no raw code', async ({ page }) => {
  await mockLookbook(page, { stream: route => route.fulfill({ status: 429, json: { ok: false, fallback: { reason: 'quota_exhausted' } } }) });
  await enterStudio(page);
  const dialog = await openDialog(page);
  await captureBtn(dialog).click();
  await expect(dialog.locator('.lookbook-slot-error')).toHaveCount(4);
  for (const error of await dialog.locator('.lookbook-slot-error').all()) await expect(error).toHaveText('Tiệm đã hết lượt chụp hôm nay, mai quay lại nhé.');
  await expect(captureBtn(dialog, 'Hết lượt hôm nay')).toBeDisabled();
  await expect(page.locator('.studio-lookbook canvas')).toHaveCount(4);
  await expect(page.locator('img.studio-ai-photo')).toHaveCount(0);
  expect(await bodyText(page)).not.toMatch(REASONS_RE);
});

test('every failure reason (and an unknown one) shows Vietnamese copy, never the code', async ({ page }) => {
  await mockLookbook(page, {
    stream: route => route.fulfill(sseResponse(lookbookStream({
      front: { status: 'error', reason: 'safety_blocked' }, turn: { status: 'error', reason: 'rate_limited' },
      back: { status: 'error', reason: 'invalid_output' }, detail: { status: 'error', reason: 'SDK exploded: 500 INTERNAL' }
    })))
  });
  await enterStudio(page);
  const dialog = await openDialog(page);
  await captureBtn(dialog).click();
  await expect(dialog.locator('.lookbook-slot-error')).toHaveCount(4);
  await expect(slot(dialog, 'front')).toContainText('Ảnh này chưa chụp được');
  await expect(slot(dialog, 'turn')).toContainText('Bạn chụp hơi nhanh');
  await expect(slot(dialog, 'back')).toContainText('Gemini chưa trả ảnh');
  await expect(slot(dialog, 'detail')).toContainText('Gemini chưa trả ảnh');
  const text = await bodyText(page);
  expect(text).not.toMatch(REASONS_RE);
  expect(text).not.toContain('SDK exploded');
});

// ---- 11 ----
test('dialog is portalled to body above the HUD; Escape closes and returns focus to the opener', async ({ page }) => {
  await mockLookbook(page, {});
  await enterStudio(page);
  // What is on top at the centre of each HUD control (wallet pill, settings button)? Both sit inside .site-header.
  const topAtHud = () => page.evaluate(() => ['.site-header .hud', '.site-header .settings-button'].map(selector => {
    const rect = document.querySelector(selector)!.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { size: rect.width * rect.height, inHud: Boolean(hit?.closest('.site-header')), inDialog: Boolean(hit?.closest('body > .modal-backdrop.lookbook-dialog')) };
  }));
  // control: the HUD is reachable without the dialog (poll: the room is still animating in)
  await expect.poll(async () => (await topAtHud()).every(hit => hit.inHud && !hit.inDialog)).toBe(true);
  const dialog = await openDialog(page);
  await expect(page.locator('body > .modal-backdrop.lookbook-dialog')).toHaveCount(1);
  for (const hit of await topAtHud()) {
    expect(hit.size).toBeGreaterThan(0);
    expect(hit).toMatchObject({ inHud: false, inDialog: true });
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener(page)).toBeFocused();
});

// ---- 12 ----
test('lightbox replaces the dialog; Escape steps back, then closes, with no new AI request', async ({ page }) => {
  const mock = await mockLookbook(page, { stream: route => route.fulfill(sseResponse(lookbookStream())) });
  await enterStudio(page);
  const dialog = await openDialog(page);
  await captureBtn(dialog).click();
  await expect(dialog.locator('figure.lookbook-slot[data-status="done"]')).toHaveCount(4);
  await dialog.getByRole('button', { name: 'Phóng to góc Chính diện', exact: true }).click();
  const lightbox = page.getByRole('dialog', { name: 'Chính diện · Áo tứ thân' });
  await expect(lightbox).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(dialogOf(page)).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialogOf(page)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener(page)).toBeFocused();
  expect(mock.all).toEqual(['/api/ai/lookbook']);
});

// ---- privacy: ids and hex only ----
const FREE_TEXT_KEYS = ['garmentName', 'eventTitle', 'story', 'prompt', 'name', 'title', 'text', 'caption'];
const IMAGE_KEYS = ['personImage', 'backgroundImage', 'heroImage'];
function assertIdsOnly(body: Body) {
  for (const key of FREE_TEXT_KEYS) expect(body, `${key} must never be sent`).not.toHaveProperty(key);
  for (const [key, value] of Object.entries(body)) {
    if (IMAGE_KEYS.includes(key)) { expect(value).toMatch(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/); continue; }
    const strings = (Array.isArray(value) ? value : [value]).filter((v): v is string => typeof v === 'string');
    for (const text of strings) expect(text, `${key}=${text}`).toMatch(/^(#[0-9a-f]{6}|[a-z0-9_-]+)$/);
  }
}

test('no request body carries free text: only ids, hex and the user photos', async ({ page }) => {
  const mock = await mockLookbook(page, {
    check: checkOk('ok'),
    stream: route => route.fulfill(sseResponse(lookbookStream({ back: { status: 'error', reason: 'timeout' } }))),
    angle: route => route.fulfill({ json: { ok: true, data: { id: 'back', image: RETRY_IMG } } })
  });
  await enterStudio(page);
  const dialog = await openDialog(page);
  await pickPerson(dialog);
  await dialog.getByRole('button', { name: 'Nền của tôi', exact: true }).click();
  await dialog.locator('input[type=file]').nth(1).setInputFiles({ name: 'room.png', mimeType: 'image/png', buffer: pngBuffer(90, 90, 90) });
  await expect(dialog.getByRole('img', { name: 'Ảnh nền của bạn' })).toBeVisible();
  await dialog.getByRole('checkbox').check();
  await expect(captureBtn(dialog)).toBeEnabled();
  await captureBtn(dialog).click();
  await expect(slot(dialog, 'back')).toHaveAttribute('data-status', 'error');
  await dialog.getByRole('button', { name: 'Chụp lại góc Sau lưng', exact: true }).click();
  await expect(slot(dialog, 'back')).toHaveAttribute('data-status', 'done');

  expect(mock.stream[0]).toMatchObject({ mode: 'personal', moodId: 'custom' });
  expect(mock.angle[0]).toMatchObject({ angle: 'back', moodId: 'custom' });
  expect(String(mock.stream[0].backgroundImage)).toMatch(/^data:image\/jpeg/);
  expect([mock.check.length, mock.stream.length, mock.angle.length]).toEqual([1, 1, 1]);
  for (const body of [...mock.check, ...mock.stream, ...mock.angle]) assertIdsOnly(body);
});
