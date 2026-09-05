import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  sheetId: process.env.GOOGLE_SHEET_ID || '',
  sheetRange: process.env.GOOGLE_SHEET_RANGE || 'Form Responses 1',
  serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  // .env files can't hold real newlines, so the key is stored with literal \n and unescaped here.
  privateKey: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};
