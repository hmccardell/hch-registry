// Maps the members table's columns to the internal field names the frontend
// expects. Keep the left side in sync with the actual Supabase column names; the
// right side is the API's public contract and is consumed by the React app.
const COLUMN_TO_FIELD = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  show_email: 'showEmail',
  show_phone: 'showPhone',
  discord_handle: 'discordHandle',
  website: 'website',
  github: 'github',
  linkedin: 'linkedin',
  skills: 'skills',
  help_offered: 'helpOffered',
  needs: 'needs',
  needs_detail: 'needsDetail',
  bio: 'bio',
  published: 'published',
};

// These reach the frontend as arrays. Accept either a native Postgres array /
// jsonb column (already an array) or a comma-separated string.
const LIST_FIELDS = new Set(['skills', 'helpOffered', 'needs']);

// These reach the frontend as booleans.
const BOOLEAN_FIELDS = new Set(['showEmail', 'showPhone', 'published']);

// Fields a signed-in member may write about themselves via PATCH /api/me.
// Everything in COLUMN_TO_FIELD except `email` — that's the sign-in key, not a
// profile field, and is never accepted from the request body.
const EDITABLE_FIELDS = new Set(
  Object.values(COLUMN_TO_FIELD).filter((field) => field !== 'email'),
);

function toList(value) {
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// One raw table row -> one internal record keyed by field name.
export function toRecord(row) {
  const record = {};
  for (const [column, field] of Object.entries(COLUMN_TO_FIELD)) {
    const raw = row[column];
    record[field] = LIST_FIELDS.has(field) ? toList(raw) : raw ?? '';
  }
  return record;
}

// The registry has no "keep me out entirely" flag — being in the table (and
// published) means being in the public directory. The only member-controlled
// redaction is per-field: email and phone are nulled unless the member opted in.
export function toPublicMember(record) {
  const { email, phone, showEmail, showPhone, published, ...rest } = record;
  return {
    ...rest,
    email: showEmail ? email : null,
    phone: showPhone ? phone : null,
  };
}

// Takes the JSON body of PATCH /api/me and returns only the table columns a
// member is allowed to write, coerced to the right shape. Anything not on
// EDITABLE_FIELDS — including `email`, `id`, `created_at`, or fields the client
// made up — is silently dropped rather than reaching the database.
export function sanitizeProfileInput(body) {
  const input = body && typeof body === 'object' ? body : {};
  const columns = {};
  for (const [column, field] of Object.entries(COLUMN_TO_FIELD)) {
    if (!EDITABLE_FIELDS.has(field) || !(field in input)) continue;
    if (LIST_FIELDS.has(field)) {
      columns[column] = toList(input[field]);
    } else if (BOOLEAN_FIELDS.has(field)) {
      columns[column] = Boolean(input[field]);
    } else {
      columns[column] = String(input[field] ?? '').trim();
    }
  }
  return columns;
}
