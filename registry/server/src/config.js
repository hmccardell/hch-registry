import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

// Env vars that are only a security problem when missing (the app still boots
// with an insecure default). In production we refuse to start instead.
function requireInProd(name, devFallback) {
  const value = process.env[name];
  if (value) return value;
  if (isProd) {
    throw new Error(
      `Missing required env var ${name}. Set it in the Render dashboard — see server/.env.example.`,
    );
  }
  console.warn(`[config] ${name} not set; using an insecure dev default. Never deploy like this.`);
  return devFallback;
}

export const config = {
  isProd,
  // Render injects its own PORT; this default is for local dev only.
  port: Number(process.env.PORT) || 4000,

  // The registry is mounted at a subpath of the main HCH site. Every route
  // (API, health, static bundle) lives under this prefix so nothing collides
  // with the host site's own routes. Must match `base` in frontend/vite.config.js
  // and the reverse-proxy path in front of the deployed service. No trailing slash.
  basePath: (process.env.BASE_PATH || '/registry').replace(/\/$/, ''),

  // Absolute, browser-facing origin + base path of the deployed registry
  // (e.g. https://hubcityhackers.com/registry). Used to build the sign-in link
  // that goes in the email. Behind a reverse proxy the inbound Host header is
  // unreliable, so set this explicitly in production. Unset locally: the link is
  // derived from the incoming request's own origin. No trailing slash.
  publicUrl: (process.env.PUBLIC_URL || '').replace(/\/$/, ''),

  // Signs both the emailed magic-link tokens and the Bearer session tokens.
  // Changing it invalidates every outstanding link and logs everyone out.
  authSecret: requireInProd('REGISTRY_AUTH_SECRET', 'dev-insecure-secret-change-me'),

  // How long an emailed sign-in link stays valid, and (once redeemed) how long
  // the resulting session lasts.
  magicLinkTtlMs: Number(process.env.MAGIC_LINK_TTL_MS) || 15 * 60 * 1000,
  sessionTtlMs: Number(process.env.SESSION_TTL_MS) || 12 * 60 * 60 * 1000,

  // Transactional email as an SMTP URL — any provider works (Resend, Postmark,
  // SES, ...): smtps://user:pass@host:465. Unset locally: sign-in links are
  // printed to the server console instead of sent.
  smtpUrl: process.env.SMTP_URL || '',
  mailFrom: process.env.MAIL_FROM || 'HCH Registry <no-reply@localhost>',

  // Supabase project that holds the members table. If unset, /api/directory
  // returns a clear 500 (see supabase.js) but the rest of the app runs.
  supabaseUrl: process.env.SUPABASE_URL || '',
  // Service-role key: server-only, bypasses row-level security. Never expose it
  // to the frontend or commit it.
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  membersTable: process.env.SUPABASE_MEMBERS_TABLE || 'members',
};
