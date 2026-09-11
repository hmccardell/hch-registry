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
  links: 'links',
  skills: 'skills',
  project_name: 'projectName',
  project_description: 'projectDescription',
  project_stage: 'projectStage',
  project_link: 'projectLink',
  help_offered: 'helpOffered',
  needs: 'needs',
  needs_detail: 'needsDetail',
  bio: 'bio',
};

// These reach the frontend as arrays. Accept either a native Postgres array /
// jsonb column (already an array) or a comma-separated string.
const LIST_FIELDS = new Set(['skills', 'helpOffered', 'needs']);

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

// The registry has no "keep me out entirely" flag — being in the table means
// being in the public directory. The only member-controlled redaction is
// per-field: email and phone are nulled unless the member opted in.
export function toPublicMember(record) {
  const { email, phone, showEmail, showPhone, ...rest } = record;
  return {
    ...rest,
    email: showEmail ? email : null,
    phone: showPhone ? phone : null,
  };
}
