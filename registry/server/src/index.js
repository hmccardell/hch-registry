import express from 'express';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config } from './config.js';
import { fetchMembers, memberExistsByEmail } from './supabase.js';
import { toRecord, toPublicMember } from './transform.js';
import { issueMagicToken, verifyMagicToken, issueSession, requireAuth } from './auth.js';
import { sendLoginLink } from './mailer.js';

const app = express();
// On Render the app sits behind one proxy hop; trust it so the rate limiter
// keys off the real client IP, not the proxy's. When the host site adds its
// own reverse proxy in front of this service, bump this to the total hop count.
if (config.isProd) app.set('trust proxy', 1);
app.use(express.json());

// Requesting a link sends an email and probes the members table, so throttle it.
const linkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in requests. Try again in a few minutes.' },
});

const CACHE_TTL_MS = 60_000;
let cache = { data: null, expiresAt: 0 };

// Replay guard for magic links. A redeemed link's `jti` is remembered until the
// moment it would have expired anyway, so a link can be used at most once.
// In-memory only — fine for the single Render instance; a multi-instance deploy
// needs a shared store (see README "Not built yet").
const consumedLinks = new Map(); // jti -> expiry (ms epoch)
function consumeLink(jti, exp) {
  const now = Date.now();
  for (const [id, expiresAt] of consumedLinks) {
    if (expiresAt <= now) consumedLinks.delete(id);
  }
  if (consumedLinks.has(jti)) return false;
  consumedLinks.set(jti, exp);
  return true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Browser-facing base URL of the registry. Prefer the configured value; fall
// back to the request's own origin (correct for local dev, and for prod as long
// as the proxy passes a truthful Host / X-Forwarded-Proto).
function publicBase(req) {
  return config.publicUrl || `${req.protocol}://${req.get('host')}${config.basePath}`;
}

// Everything the registry exposes hangs off this router, which is mounted at
// config.basePath (default /registry). Paths below are relative to that prefix.
const registry = express.Router();

registry.get('/health', (req, res) => res.json({ ok: true }));

// Step 1 — member asks for a link. Always answers the same 200 whether or not
// the address is on the roster, so it can't be used to test who's a member.
registry.post('/api/auth/request-link', linkLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  try {
    if (await memberExistsByEmail(email)) {
      const token = issueMagicToken(email);
      const url = `${publicBase(req)}/api/auth/callback?token=${encodeURIComponent(token)}`;
      await sendLoginLink(email, url);
    }
  } catch (err) {
    console.error('[auth] request-link failed:', err);
    return res.status(503).json({ error: 'Sign-in is temporarily unavailable.' });
  }
  res.json({ ok: true });
});

// Step 2 — member clicks the emailed link. Verify it, burn it, then bounce to
// the app with the session token in the URL fragment. A fragment is never sent
// to any server; the app reads it once and strips it from the address bar.
registry.get('/api/auth/callback', (req, res) => {
  const appUrl = `${publicBase(req)}/`;
  const claims = verifyMagicToken(String(req.query.token || ''));
  if (!claims || !consumeLink(claims.jti, claims.exp)) {
    return res.redirect(`${appUrl}#error=link`);
  }
  const session = issueSession(claims.sub);
  res.redirect(`${appUrl}#token=${encodeURIComponent(session)}`);
});

registry.get('/api/directory', requireAuth, async (req, res) => {
  try {
    if (cache.data && Date.now() < cache.expiresAt) {
      return res.json(cache.data);
    }
    const rows = await fetchMembers();
    const members = rows.map(toRecord).map(toPublicMember).filter(Boolean);
    cache = { data: members, expiresAt: Date.now() + CACHE_TTL_MS };
    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load directory' });
  }
});

// In production the built frontend ships inside this same service, so the app
// is single-origin and needs no CORS config. Locally this directory doesn't
// exist — Vite serves the frontend on :5173 and proxies the API here.
const clientDir = join(dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (existsSync(clientDir)) {
  registry.use(express.static(clientDir));
  registry.use((req, res) => {
    // req.path here is already stripped of config.basePath by the mount.
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(join(clientDir, 'index.html'));
  });
}

app.use(config.basePath, registry);

// Bare-origin hits (health probes, someone opening the service URL directly)
// land on the app instead of a 404.
app.get('/', (req, res) => res.redirect(`${config.basePath}/`));

app.listen(config.port, () => {
  console.log(
    `HCH registry server listening on http://localhost:${config.port}${config.basePath}`,
  );
});
