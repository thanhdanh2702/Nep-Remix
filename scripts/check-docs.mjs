// Keeps the docs honest about the code: every file a doc names must exist, every code symbol it names must
// be in src/, and the retired spec (64x96 sprites, 800x500 grid, paperdoll, "pixelated everywhere") may only
// appear on lines that say it is history. Run: npm run test:docs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, basename, dirname, posix } from 'node:path';

const root = process.cwd();
const SKIP_DIRS = new Set(['node_modules', 'dist', 'artifacts', 'test-results', 'plans', '.git', '.claude', '_raw']);
function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) { if (!SKIP_DIRS.has(entry.name)) yield* walk(join(dir, entry.name)); }
    else yield join(dir, entry.name);
  }
}
const files = [...walk(root)].map(p => relative(root, p).replaceAll('\\', '/'));
const fileSet = new Set(files);
const names = new Set(files.map(p => basename(p)));
const docs = files.filter(p => p.endsWith('.md') && (p === 'README.md' || p.startsWith('docs/') || p.startsWith('assets/')));
const source = files.filter(p => /^(src|scripts)\//.test(p) && /\.(tsx?|css|json|mjs|py)$/.test(p) || p === 'server.ts')
  .map(p => readFileSync(p, 'utf8')).join('\n');

// A line that marks something as past, removed, pending or unused may name it freely (⬜ = not generated yet).
const HISTORY = /⬜|lịch sử|đã xóa|đã gỡ|gỡ khỏi|bãi bỏ|thay thế bởi|đã thay|chờ gen lại|chưa gen|chưa có|chưa dùng|không còn|spec cũ|bản cũ|trước đây|superseded|deprecated|legacy|removed/i;
const RETIRED = [
  [/\b64 ?[×x] ?96\b/, '64x96 sprite spec'],
  [/lưới logic 800|800 ?[×x] ?500 ?(px)? ?\(?lưới|integer[- ]scaling ×2|1600 ?[×x] ?1000/i, '800x500 grid / x2 artboard'],
  [/\b270 ?[×x] ?480\b/, '270x480 portrait (real files are 320x480)'],
  [/paperdoll|ma-nơ-canh trên bục|búp bê giấy/i, 'paperdoll'],
  [/(toàn bộ|mọi|tất cả)[^.\n]*(pixelated|imageSmoothingEnabled = false)|(pixelated|imageSmoothingEnabled = false)[^.\n]*(toàn bộ|mọi ảnh|tất cả)/i, 'pixelated everywhere'],
];
// The rename log is a record of the past: every file name in it is history by definition.
const HISTORY_FILES = new Set(['assets/_migration.md']);
// Words docs use as concepts or that belong to external tools, not to this codebase.
const NOT_CODE = new Set(['humanHeight', 'secretAccessor', 'BILLING_ACCOUNT_ID']);
const FILE_TOKEN = /`([^`\s]+\.(png|json|ts|tsx|css|mjs|py|md))`/g;
const SYMBOL_TOKEN = /`([A-Za-z_][A-Za-z0-9_]*)(?:\.[A-Za-z_]\w*)?(?:\([^`]*\))?`/g;
const isSymbol = s => /[a-z][A-Z]/.test(s) || /^[A-Z][A-Z0-9]*_[A-Z0-9_]+$/.test(s);

const problems = [];
for (const doc of docs) {
  const dir = dirname(doc);
  readFileSync(doc, 'utf8').split(/\r?\n/).forEach((line, i) => {
    const at = `${doc}:${i + 1}`;
    const history = HISTORY_FILES.has(doc) || HISTORY.test(line);
    // "**Không** áp pixelated…" states the rule against the retired spec, so negated lines pass.
    if (!history && !/\bkhông\b/i.test(line)) for (const [re, what] of RETIRED) if (re.test(line)) problems.push(`${at}  retired spec (${what}) stated as current`);
    // QA screenshots and reports under artifacts/ are generated at run time and never committed.
    if (history || /artifacts\//.test(line)) return;
    for (const [, token] of line.matchAll(FILE_TOKEN)) {
      if (/[*<>{}]|\.\.\./.test(token)) continue;
      const path = token.replace(/^\.?\//, '');
      const found = path.includes('/') ? fileSet.has(path) || fileSet.has(posix.normalize(`${dir}/${path}`)) : names.has(path);
      if (!found) problems.push(`${at}  names missing file ${token}`);
    }
    for (const [, symbol] of line.matchAll(SYMBOL_TOKEN)) {
      if (isSymbol(symbol) && !NOT_CODE.has(symbol) && !new RegExp(`\\b${symbol}\\b`).test(source)) problems.push(`${at}  names unknown code symbol ${symbol}`);
    }
  });
}
if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\ncheck-docs: ${problems.length} problem(s) in ${docs.length} docs`);
  process.exit(1);
}
console.log(`check-docs: ${docs.length} docs consistent with the code`);
