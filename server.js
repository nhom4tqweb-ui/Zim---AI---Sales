import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './server/config.js';
import { initialGreeting, respond } from './server/conversationEngine.js';
import { buildRecommendation } from './server/recommendationEngine.js';
import { maybeNaturalizeParts } from './server/llmAdapter.js';
import { saveLead } from './server/leadStore.js';
import { claimVoucher } from './server/voucherStore.js';
import { trackEvent } from './server/analytics.js';
import { EXAM_REWARD_PERKS } from './server/zimKnowledge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function sendJson(res, status, payload) {
  securityHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function readJson(req, maxBytes = 65536) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      raw += chunk.toString('utf8');
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Chia 1 tin nhắn thành các cụm ~4 từ, GIỮ NGUYÊN khoảng trắng/xuống dòng.
function splitForStreaming(text) {
  const tokens = String(text).match(/\S+\s*/g) || [];
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 4) chunks.push(tokens.slice(i, i + 4).join(''));
  return chunks;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function streamChat(req, res) {
  const body = await readJson(req);
  const result = respond(body);
  const parts = await maybeNaturalizeParts(result.parts, { profile: result.profile, message: body.message });

  if (result.leadCaptured) {
    try { saveLead({ userId: typeof body.userId === 'string' ? body.userId.slice(0, 80) : 'anonymous', phone: result.profile.phone, profile: result.profile }); }
    catch (error) { console.error('[lead] save failed', error.message); }
    trackEvent({ name: 'lead_submitted', userId: body.userId, properties: { source: 'chatbot', program: result.profile.program || null } });
  }

  securityHeaders(res);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let closed = false;
  req.on('close', () => { closed = true; });
  const send = (payload) => { if (!closed) res.write(`data: ${JSON.stringify(payload)}\n\n`); };

  send({
    type: 'meta', stage: result.stage, profile: result.profile, quickReplies: result.quickReplies,
    recommendation: result.recommendation || null, intent: result.intent || null, clientAction: result.clientAction || null,
  });

  // Mỗi phần là 1 bong bóng; nghỉ ngắn giữa các bong bóng như người đang gõ tin tiếp theo.
  for (let p = 0; p < parts.length && !closed; p += 1) {
    if (p > 0) {
      send({ type: 'break' });
      await sleep(Math.min(350 + parts[p].length * 6, 1100));
    }
    for (const chunk of splitForStreaming(parts[p])) {
      if (closed) break;
      send({ type: 'delta', text: chunk });
      await sleep(32);
    }
  }
  send({ type: 'done' });
  if (!closed) res.end();
}

function serveStatic(req, res) {
  const rawPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const requestPath = rawPath === '/' ? '/index.html' : rawPath;
  const normalized = path.normalize(requestPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(publicDir, normalized);

  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }
    securityHeaders(res);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': requestPath.endsWith('.html') ? 'no-cache' : 'public, max-age=300',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(res, 200, { ok: true, service: 'zim-sales-ai-demo', time: new Date().toISOString() });
    }

    if (req.method === 'GET' && url.pathname === '/api/chat/initial') {
      return sendJson(res, 200, initialGreeting());
    }

    if (req.method === 'GET' && url.pathname === '/api/rewards/exam') {
      return sendJson(res, 200, { perks: EXAM_REWARD_PERKS.map(({ title, value, detail }) => ({ title, value, detail })), amount: config.demoVoucherAmount });
    }

    if (req.method === 'POST' && url.pathname === '/api/chat/stream') {
      return await streamChat(req, res);
    }

    if (req.method === 'POST' && url.pathname === '/api/recommend') {
      const body = await readJson(req);
      return sendJson(res, 200, buildRecommendation(body.profile || {}));
    }

    if (req.method === 'POST' && url.pathname === '/api/vouchers/claim') {
      const body = await readJson(req);
      if (!body || typeof body.userId !== 'string' || !body.userId.trim()) {
        return sendJson(res, 400, { error: 'userId is required' });
      }
      const voucher = claimVoucher(body);
      return sendJson(res, 200, { ok: true, voucher });
    }

    if (req.method === 'POST' && url.pathname === '/api/events') {
      const body = await readJson(req);
      const event = trackEvent(body);
      return sendJson(res, 202, { ok: true, event });
    }

    if (req.method === 'GET') return serveStatic(req, res);
    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    const status = /Payload too large/.test(error.message) ? 413 : /Invalid JSON/.test(error.message) ? 400 : 500;
    return sendJson(res, status, { error: status === 500 ? 'Internal server error' : error.message });
  }
});

server.listen(config.port, config.host, () => {
  console.log(`ZIM Sales AI Demo running at http://localhost:${config.port}`);
});