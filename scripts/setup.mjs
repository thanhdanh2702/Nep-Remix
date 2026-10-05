// One-time local setup: creates .env from .env.example and stores GEMINI_API_KEY (never printed).
// Usage: npm run setup            (prompts for the key, Enter to skip)
//        npm run setup -- --key <KEY>   (no prompt, for CI)
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
const examplePath = join(root, '.env.example');

function keyFromArgs(args) {
  const i = args.findIndex(a => a === '--key' || a.startsWith('--key='));
  if (i < 0) return null;
  return args[i].includes('=') ? args[i].slice(args[i].indexOf('=') + 1) : args[i + 1] ?? '';
}

// Hidden input on a TTY (raw mode); plain line read when stdin is piped.
function ask(question) {
  return new Promise(resolve => {
    if (!process.stdin.isTTY) {
      const rl = createInterface({ input: process.stdin });
      rl.once('line', line => { rl.close(); resolve(line); });
      rl.once('close', () => resolve(''));
      process.stdout.write(question);
      return;
    }
    process.stdout.write(question);
    let value = '';
    const stdin = process.stdin;
    stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
    const finish = result => { stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData); process.stdout.write('\n'); resolve(result); };
    const onData = chunk => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') return finish(value);
        if (ch === '\u0003') { process.stdout.write('\n'); process.exit(130); }
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else if (ch >= ' ') value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

function writeKey(key) {
  const text = readFileSync(envPath, 'utf8');
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const line = 'GEMINI_API_KEY=' + key;
  const isKey = l => /^\s*GEMINI_API_KEY\s*=/.test(l);
  const first = lines.findIndex(isKey);
  // Keep exactly one GEMINI_API_KEY line: replace the first, drop any duplicates.
  const out = lines.map((l, i) => (i === first ? line : l)).filter((l, i) => i === first || !isKey(l));
  if (first < 0) { if (out[out.length - 1] === '') out.pop(); out.push(line, ''); }
  writeFileSync(envPath, out.join(eol));
}

function hasKey() {
  return /^\s*GEMINI_API_KEY\s*=\s*\S/m.test(readFileSync(envPath, 'utf8'));
}

const args = process.argv.slice(2);
const fromArg = keyFromArgs(args);
if (args.some(a => a === '--key' || a.startsWith('--key=')) && !fromArg?.trim()) {
  console.error('Thiếu giá trị cho --key.'); process.exit(1);
}
if (!existsSync(envPath)) {
  if (existsSync(examplePath)) { copyFileSync(examplePath, envPath); console.log('Đã tạo .env từ .env.example.'); }
  else { writeFileSync(envPath, ''); console.log('Đã tạo .env trống (không thấy .env.example).'); }
} else console.log('.env đã có, giữ nguyên các biến khác.');

const key = (fromArg ?? await ask('Dán Gemini API key (Enter để bỏ qua; lấy tại https://aistudio.google.com/apikey): ')).trim();

if (key) {
  if (/[\s"'`]/.test(key)) { console.error('Key không hợp lệ (có khoảng trắng hoặc dấu nháy). Chạy lại npm run setup.'); process.exit(1); }
  writeKey(key);
  console.log('Đã ghi GEMINI_API_KEY vào .env (không hiển thị key).');
} else if (hasKey()) console.log('Giữ GEMINI_API_KEY hiện có trong .env.');
else console.log('Chưa có key: game vẫn chạy với gợi ý có sẵn (AI offline). Chạy lại npm run setup khi có key.');

console.log('\nBước tiếp theo:\n  npm run dev        # mở http://localhost:3000\n  npm run smoke:ai   # (tuỳ chọn) kiểm tra key với Gemini');
