import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { transformSync } from 'esbuild';
import { chromium, expect } from '@playwright/test';

const fixtureCode = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DocumentViewer, C3_DOCUMENTS } from '/src/game/DocumentViewer.tsx';

function BrowserReaderProbe() {
  const [docId, setDocId] = useState(new URLSearchParams(location.search).get('doc') || 'doc-c3-bien-nhan');
  const [readOnly, setReadOnly] = useState(new URLSearchParams(location.search).get('readonly') === 'true');
  const [open, setOpen] = useState(true);
  const [acks, setAcks] = useState(0);

  const doc = C3_DOCUMENTS[docId];

  return (
    <div style={{ padding: 20, minHeight: '200vh' }}>
      <h1>Document Viewer Browser Probe</h1>
      <div data-testid="probe-controls">
        <span data-testid="ack-count">{acks}</span>
        <button onClick={() => { setDocId('doc-c3-bien-nhan'); setReadOnly(false); setOpen(true); }}>Doc Bien Nhan Active</button>
        <button onClick={() => { setDocId('doc-c3-so-goc'); setReadOnly(false); setOpen(true); }}>Doc So Goc Active</button>
        <button onClick={() => { setDocId('doc-c3-thu-thoa-thuan'); setReadOnly(false); setOpen(true); }}>Doc Thu Active</button>
        <button onClick={() => { setDocId('doc-c3-ban-sua'); setReadOnly(false); setOpen(true); }}>Doc Ban Sua Active</button>
        <button onClick={() => { setDocId('doc-c3-so-goc'); setReadOnly(true); setOpen(true); }}>Doc So Goc ReadOnly</button>
      </div>

      {open && (
        <DocumentViewer
          document={doc}
          readOnly={readOnly}
          onAdvance={() => { setAcks(a => a + 1); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<BrowserReaderProbe />);
`;

const srv = await createServer({
  root: process.cwd(),
  configFile: false,
  server: { host: '127.0.0.1', port: 0, strictPort: true },
  plugins: [
    {
      name: 'probe-loader',
      resolveId(id) {
        if (id === '/__browser_reader.tsx') return '\0browser-reader.tsx';
      },
      load(id) {
        if (id === '\0browser-reader.tsx') {
          return transformSync(fixtureCode, { loader: 'tsx', jsx: 'automatic', format: 'esm' }).code;
        }
      },
      configureServer(s) {
        s.middlewares.use((req, res, next) => {
          if (req.url?.split('?')[0] === '/__browser_reader') {
            res.setHeader('Content-Type', 'text/html');
            res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="icon" href="data:,">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/src/ui/index.css">
  <link rel="stylesheet" href="/src/game/game.css">
  <link rel="stylesheet" href="/src/game/puzzle.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/__browser_reader.tsx"></script>
</body>
</html>`);
          } else {
            next();
          }
        });
      },
    },
  ],
});


await srv.listen();
const browser = await chromium.launch({channel:'chrome',headless:true});
let cases=0;
try {
 for (const viewport of [{width:1366,height:900},{width:390,height:844},{width:844,height:390}]) {
  for (const reducedMotion of ['reduce','no-preference']) {
   for (const doc of ['doc-c3-bien-nhan','doc-c3-so-goc','doc-c3-thu-thoa-thuan','doc-c3-ban-sua']) {
    for (const readOnly of [false,true]) {
     const page=await browser.newPage({viewport,reducedMotion});
     const errors=[];
     page.on('pageerror',e=>errors.push(e.message));
     page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
     page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
     await page.goto(srv.resolvedUrls.local[0]+`__browser_reader?doc=${doc}&readonly=${readOnly}`);
     const body=page.getByRole('region',{name:/^Văn bản chứng cứ:/});
     await expect(body).toBeFocused();
     await page.locator('.document-paper-img').evaluate(async img=>{await img.decode()});
     const outside=await page.evaluate(()=>window.scrollY);
     const max=await body.evaluate(el=>Math.max(0,el.scrollHeight-el.clientHeight));
     await page.keyboard.press('ArrowDown');
     if(max>0)await expect.poll(()=>body.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
     await page.keyboard.press('PageDown');
     await page.keyboard.press('End');
     await expect.poll(()=>body.evaluate(el=>Math.abs(el.scrollTop-(el.scrollHeight-el.clientHeight)))).toBeLessThanOrEqual(2);
     assert.equal(await page.evaluate(()=>window.scrollY),outside);
     // The final text is within the actual inner scroll clipping box.
     assert.ok(await page.locator('.doc-comparative-text').evaluate(el=>{const r=el.getBoundingClientRect(),b=el.closest('.document-viewer-body').getBoundingClientRect();return r.bottom<=b.bottom+2&&r.bottom>b.top}));
     assert.equal(await page.getByTestId('ack-count').textContent(),'0');
     await page.keyboard.press('Home');
     await expect.poll(()=>body.evaluate(el=>el.scrollTop)).toBeLessThanOrEqual(2);
     await page.keyboard.press('Tab');
     assert.ok(await page.getByRole('dialog').evaluate(el=>el.contains(document.activeElement)));
     await page.keyboard.press('Shift+Tab');
     await expect(body).toBeFocused();
     await page.keyboard.press('Escape');
     assert.equal(await page.getByTestId('ack-count').textContent(),'0');
     if(readOnly)assert.equal(await page.getByRole('dialog').count(),0);
     else {
      await expect(body).toBeVisible();
      await page.getByTestId('document-advance-button').click();
      assert.equal(await page.getByTestId('ack-count').textContent(),'1');
     }
     assert.deepEqual(errors,[]);
     await page.close();cases++;
    }
   }
  }
 }
 console.log(`PASS: ${cases} mounted document cases; 4 documents × 2 modes × 3 viewports × 2 motion settings; production CSS, HTTP/console checks, inner scroll, focus and explicit acknowledgement. Fixture only.`);
} finally {await browser.close();await srv.close();}
