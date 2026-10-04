import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

import { runSelfCheck } from './src/core/self-check.ts';
import { fromJSON } from './src/core/history/serialize.ts';
import { validateState } from './src/core/invariants.ts';
import { replayPath } from './src/core/history/replay.ts';
import { loadContent } from './src/content/index.ts';
import { SERVER_LIMITS } from './src/config/limits.ts';
import { aiRouter } from './src/server/ai/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';
const APP_VERSION = '1.0.0';

const app = express();
// Behind Cloud Run / a single reverse proxy: trust X-Forwarded-For so req.ip is the real client
app.set('trust proxy', 1);

// ----------------------------------------------------
// 1. Middlewares: Body limit & Sanitized Error Logging
// ----------------------------------------------------
app.use(express.json({ limit: SERVER_LIMITS.maxBodySize }));
app.use(express.urlencoded({ extended: true, limit: SERVER_LIMITS.maxBodySize }));

// Simple in-memory rate limiter for AI routes (/api/ai/*)
const ipRateMap = new Map<string, { count: number; resetTime: number }>();
const IP_RATE_MAP_SWEEP_SIZE = 1000;

app.use('/api/ai/*', (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = SERVER_LIMITS.aiRateLimit.windowMs;
  const maxRequests = SERVER_LIMITS.aiRateLimit.maxRequestsPerWindow;

  let clientRecord = ipRateMap.get(ip);
  if (!clientRecord || now > clientRecord.resetTime) {
    // Drop expired entries so the map cannot grow without bound
    if (ipRateMap.size > IP_RATE_MAP_SWEEP_SIZE) {
      for (const [key, record] of ipRateMap) {
        if (now > record.resetTime) ipRateMap.delete(key);
      }
    }
    clientRecord = { count: 1, resetTime: now + windowMs };
    ipRateMap.set(ip, clientRecord);
    return next();
  }

  clientRecord.count += 1;
  if (clientRecord.count > maxRequests) {
    return res.status(429).json({
      ok: false,
      error: 'Quá nhiều yêu cầu đến dịch vụ AI. Vui lòng thử lại sau giây lát.'
    });
  }

  next();
});

// ----------------------------------------------------
// 2. AI Feature Endpoints (/api/ai/*)
// ----------------------------------------------------
app.use('/api/ai', aiRouter);

// ----------------------------------------------------
// 3. Health & Verification API Endpoints
// ----------------------------------------------------

// Basic health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    version: APP_VERSION
  });
});

// Core engine self-check (PASS / FAIL report for preview diagnostics)
app.get('/api/health/core', (_req, res) => {
  try {
    const report = runSelfCheck();
    res.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      ok: false,
      error: `Self check error: ${message}`
    });
  }
});

// Verify save data without persisting
app.post('/api/save/verify', (req, res) => {
  try {
    const content = loadContent();
    const savePayload = req.body;
    const saveStr =
      typeof savePayload === 'string'
        ? savePayload
        : savePayload.saveJson
        ? savePayload.saveJson
        : JSON.stringify(savePayload);

    const fromRes = fromJSON(saveStr, content);
    if (!fromRes.ok) {
      return res.json({
        ok: false,
        errors: [fromRes.reason]
      });
    }

    const tree = fromRes.tree;
    const headNode = tree.nodes[tree.headId];
    if (!headNode) {
      return res.json({
        ok: false,
        errors: [`Head node '${tree.headId}' missing from save tree.`]
      });
    }

    const errors: string[] = [];

    // 1. Invariant validation
    const validRes = validateState(headNode.snapshot, content);
    if (!validRes.valid) {
      errors.push(...validRes.errors);
    }

    // 2. Replay validation
    const repRes = replayPath(tree, tree.headId, content);
    if (!repRes.ok) {
      errors.push(repRes.reason);
    } else if (!repRes.matchesSnapshot) {
      errors.push('Replay path output differs from snapshot stored at head node.');
    }

    return res.json({
      ok: errors.length === 0,
      errors
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({
      ok: false,
      errors: [`Save verification failed: ${message}`]
    });
  }
});

// ----------------------------------------------------
// 3. Static & Vite SPA Middleware
// ----------------------------------------------------
async function setupServer() {
  if (!isProd) {
    // Development: Vite middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.resolve(__dirname)
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Sanitized global error handler: logs error without dumping large image/base64 payloads
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    let cleanMessage = err instanceof Error ? err.message : String(err);
    // Strip any potential base64 image strings
    cleanMessage = cleanMessage.replace(/data:image\/[a-zA-Z]+;base64,[^"'\s]+/g, '[IMAGE_BASE64_DATA_OMITTED]');
    console.error(`[Server Error]: ${cleanMessage}`);

    res.status(500).json({
      ok: false,
      error: 'Đã xảy ra lỗi nội bộ máy chủ.'
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Tiệm May Nếp backend server running on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

setupServer().catch((err) => {
  console.error('[Server Setup Error]:', err);
  process.exit(1);
});
