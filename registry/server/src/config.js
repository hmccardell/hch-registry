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

  // Single shared access gate for the registry, checked server-side so the
  // password never ships in the frontend bundle. Vars are REGISTRY_-prefixed
  // so they don't clash with the host site's own AUTH_* when this service
  // shares an environment group with it.
  authUser: process.env.REGISTRY_AUTH_USER || 'hch',
  authPassword: requireInProd('REGISTRY_AUTH_PASSWORD', 'dev-password-change-me'),
  // Signs session tokens. Changing it logs everyone out.
  authSecret: requireInProd('REGISTRY_AUTH_SECRET', 'dev-insecure-secret-change-me'),

  // The Google Sheet the registry form writes to. If unset, /api/directory
  // returns a clear 500 (see googleSheets.js) but the rest of the app runs.
  sheetId: process.env.GOOGLE_SHEET_ID || '',
  sheetRange: process.env.GOOGLE_SHEET_RANGE || 'Form Responses 1',
  serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  // Stored with literal \n (env files can't hold real newlines); unescape here.
  // A value pasted with real newlines passes through untouched.
  privateKey: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};
