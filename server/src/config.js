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

  // Single shared access gate for the registry, checked server-side so the
  // password never ships in the frontend bundle.
  authUser: process.env.AUTH_USER || 'hch',
  authPassword: requireInProd('AUTH_PASSWORD', 'dev-password-change-me'),
  // Signs session tokens. Changing it logs everyone out.
  authSecret: requireInProd('AUTH_SECRET', 'dev-insecure-secret-change-me'),

  // The Google Sheet the registry form writes to. If unset, /api/directory
  // returns a clear 500 (see googleSheets.js) but the rest of the app runs.
  sheetId: process.env.GOOGLE_SHEET_ID || '',
  sheetRange: process.env.GOOGLE_SHEET_RANGE || 'Form Responses 1',
  serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  // Stored with literal \n (env files can't hold real newlines); unescape here.
  // A value pasted with real newlines passes through untouched.
  privateKey: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};
