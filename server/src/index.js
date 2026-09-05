import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { fetchRawRows } from './googleSheets.js';
import { buildRecords, toPublicMember } from './transform.js';

const app = express();
app.use(cors({ origin: config.corsOrigin }));

const CACHE_TTL_MS = 60_000;
let cache = { data: null, expiresAt: 0 };

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/api/directory', async (req, res) => {
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

app.listen(config.port, () => {
  console.log(`HCH registry server listening on http://localhost:${config.port}`);
});
