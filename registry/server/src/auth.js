import crypto from 'node:crypto';
import { config } from './config.js';

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Stateless signed token: base64url(JSON payload).base64url(HMAC-SHA256).
// The HMAC covers a `label` as well as the payload, so a token minted for one
// purpose ("magic") can never be replayed as another ("session"), even though
// both are signed with the same secret.
function sign(label, payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', config.authSecret)
    .update(`${label}.${body}`)
    .digest('base64url');
  return `${body}.${sig}`;
}

function unsign(label, token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto
    .createHmac('sha256', config.authSecret)
    .update(`${label}.${body}`)
    .digest('base64url');
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (typeof payload.exp !== 'number' || Date.now() >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// --- Magic link: emailed, short-lived, single-use (replay guard lives in
// index.js keyed on `jti`). Proves control of the email address. ---
export function issueMagicToken(email) {
  return sign('magic', {
    sub: email,
    jti: crypto.randomBytes(9).toString('base64url'),
    exp: Date.now() + config.magicLinkTtlMs,
  });
}

export function verifyMagicToken(token) {
  return unsign('magic', token); // -> { sub, jti, exp } | null
}

// --- Session: returned after a link is redeemed, sent as `Authorization:
// Bearer` on every subsequent request. No server-side store. ---
export function issueSession(email) {
  return sign('session', { sub: email, exp: Date.now() + config.sessionTtlMs });
}

export function verifySession(token) {
  return unsign('session', token); // -> { sub, exp } | null
}

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = verifySession(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = { email: session.sub };
  next();
}
