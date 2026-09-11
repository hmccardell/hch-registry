import express from 'express';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config } from './config.js';
import {
  fetchMembers,
  memberExistsByEmail,
  fetchMemberByEmail,
  updateMemberByEmail,
} from './supabase.js';
import { toRecord, toPublicMember, sanitizeProfileInput } from './transform.js';
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

// Only the production process serves the built SPA. A leftover frontend/dist
// from `npm run build` must not take over local :4000 — that's what made
// magic links land on a stale (or empty) origin instead of Vite.
const clientDir = join(dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
const servingStatic = config.isProd && existsSync(clientDir);

// Browser-facing base URL of the registry. Prefer PUBLIC_URL; in local API-only
// mode (no dist) always use the Vite origin so magic-link callbacks don't land
// on :4000, which has no UI. Otherwise derive from the request origin.
function publicBase(req) {
  if (config.publicUrl) return config.publicUrl;
  if (!servingStatic) return `${config.devFrontendUrl}${config.basePath}`;
  return `${req.protocol}://${req.get('host')}${config.basePath}`;
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
  let loginUrl;
  try {
    if (await memberExistsByEmail(email)) {
      const token = issueMagicToken(email);
      const callback = `/api/auth/callback?token=${encodeURIComponent(token)}`;
      await sendLoginLink(email, `${publicBase(req)}${callback}`);
      // Console-mode only: the login page can follow this same-origin path
      // through Vite's proxy instead of hunting the other terminal for a URL.
      if (!config.isProd && !config.smtpUrl) {
        loginUrl = `${config.basePath}${callback}`;
      }
    }
  } catch (err) {
    console.error('[auth] request-link failed:', err);
    return res.status(503).json({ error: 'Sign-in is temporarily unavailable.' });
  }
  res.json({ ok: true, ...(loginUrl ? { loginUrl } : {}) });
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

// A member's own record, unredacted (it's their own email/phone). Looked up by
// req.user.email — set by requireAuth from the session token — never by
// anything the client sends, so there is no way to ask for someone else's row.
registry.get('/api/me', requireAuth, async (req, res) => {
  try {
    const row = await fetchMemberByEmail(req.user.email);
    if (!row) return res.status(404).json({ error: 'No profile found for this account' });
    res.json(toRecord(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

registry.patch('/api/me', requireAuth, async (req, res) => {
  const columns = sanitizeProfileInput(req.body);
  if (Object.keys(columns).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  try {
    const row = await updateMemberByEmail(req.user.email, columns);
    if (!row) return res.status(404).json({ error: 'No profile found for this account' });
    cache = { data: null, expiresAt: 0 }; // so the edit shows up on the next directory load
    res.json(toRecord(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

if (servingStatic) {
  registry.use(express.static(clientDir));
  registry.use((req, res) => {
    // req.path here is already stripped of config.basePath by the mount.
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(join(clientDir, 'index.html'));
  });
} else {
  // Local API-only mode: send browser navigations to Vite so opening :4000
  // doesn't look like a dead server.
  registry.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.redirect(302, `${config.devFrontendUrl}${req.originalUrl}`);
  });
}

app.use(config.basePath, registry);

// Bare-origin hits (health probes, someone opening the service URL directly)
// land on the app instead of a 404.
app.get('/', (req, res) => res.redirect(`${config.basePath}/`));

app.listen(config.port, () => {
  if (servingStatic) {
    console.log(
      `HCH registry listening on http://localhost:${config.port}${config.basePath}`,
    );
  } else {
    console.log(
      `HCH registry API on http://localhost:${config.port}${config.basePath} — open the app at ${config.devFrontendUrl}${config.basePath}/`,
    );
  }
});
