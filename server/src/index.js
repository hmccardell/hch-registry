import express from 'express';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config } from './config.js';
import { fetchRawRows } from './googleSheets.js';
import { buildRecords, toPublicMember } from './transform.js';
import { verifyCredentials, issueToken, requireAuth } from './auth.js';

const app = express();
// On Render the app sits behind one proxy hop; trust it so the rate limiter
// keys off the real client IP, not the proxy's.
if (config.isProd) app.set('trust proxy', 1);
app.use(express.json());

// The login endpoint guards a single shared password, so throttle guesses.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in a few minutes.' },
});

const CACHE_TTL_MS = 60_000;
let cache = { data: null, expiresAt: 0 };

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!verifyCredentials(username, password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  res.json({ token: issueToken() });
});

app.get('/api/directory', requireAuth, async (req, res) => {
  try {
    if (cache.data && Date.now() < cache.expiresAt) {
      return res.json(cache.data);
    }
    const rows = await fetchRawRows();
    const members = buildRecords(rows).map(toPublicMember).filter(Boolean);
    cache = { data: members, expiresAt: Date.now() + CACHE_TTL_MS };
    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load directory' });
  }
});

// In production the built frontend ships inside this same service, so the app
// is single-origin and needs no CORS config. Locally this directory doesn't
// exist — Vite serves the frontend on :5173 and proxies /api here.
const clientDir = join(dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (existsSync(clientDir)) {
  app.use(express.static(clientDir));
  app.use((req, res) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(join(clientDir, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`HCH registry server listening on http://localhost:${config.port}`);
});
