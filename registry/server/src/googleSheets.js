import { google } from 'googleapis';
import { config } from './config.js';

let sheetsClient;

function getClient() {
  if (!sheetsClient) {
    const auth = new google.auth.JWT(
      config.serviceAccountEmail,
      null,
      config.privateKey,
      ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    );
    sheetsClient = google.sheets({ version: 'v4', auth });
  }
  return sheetsClient;
}

export async function fetchRawRows() {
  if (!config.sheetId || !config.serviceAccountEmail || !config.privateKey) {
    throw new Error('Google Sheets credentials are not configured — see server/.env.example');
  }
  const sheets = getClient();
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: config.sheetId,
    range: config.sheetRange,
  });
  return data.values || [];
}
