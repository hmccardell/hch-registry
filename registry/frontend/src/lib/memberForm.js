import { SKILLS_OPTIONS, HELP_OFFERED_OPTIONS, NEEDS_OPTIONS } from './formOptions.js';

// Field lists shared by the onboarding and profile screens. Keep the field
// names in sync with COLUMN_TO_FIELD in server/src/transform.js.
export const CONTACT_FIELDS = [
  ['discordHandle', 'Discord handle'],
  ['website', 'Website'],
  ['github', 'GitHub'],
  ['linkedin', 'LinkedIn'],
];

export const SKILLS_FIELD = ['skills', 'Skills', SKILLS_OPTIONS];
export const OFFERS_FIELD = ['helpOffered', 'Offers', HELP_OFFERED_OPTIONS];
export const NEEDS_FIELD = ['needs', 'Needs', NEEDS_OPTIONS];
export const CHECKBOX_FIELDS = [SKILLS_FIELD, OFFERS_FIELD, NEEDS_FIELD];

// The table has one `name` column; the form collects it as two fields, so
// split/join happens at the edges.
export function splitName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

// The API sends/accepts these as one flat array. Split it into the options
// that match a known checkbox and whatever's left, which becomes the
// free-text "Other" field; the two are recombined into one array on save.
export function splitKnownAndOther(values, options) {
  const known = [];
  const other = [];
  for (const v of values || []) (options.includes(v) ? known : other).push(v);
  return { known, other: other.join(', ') };
}

export function toFormState(record) {
  const form = { ...record, ...splitName(record.name) };
  for (const [key, , options] of CHECKBOX_FIELDS) {
    const { known, other } = splitKnownAndOther(record[key], options);
    form[key] = known;
    form[`${key}Other`] = other;
  }
  return form;
}

export function toPatchBody(form) {
  const body = { ...form };
  delete body.email; // read-only — the server ignores it either way
  delete body.firstName;
  delete body.lastName;
  body.name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
  for (const [key] of CHECKBOX_FIELDS) {
    const otherKey = `${key}Other`;
    const other = (form[otherKey] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    body[key] = [...form[key], ...other];
    delete body[otherKey];
  }
  return body;
}

export function formHandlers(setForm, clearFeedback) {
  const onFieldChange = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    clearFeedback();
  };
  const onToggleList = (key, option) => {
    setForm((f) => {
      const values = new Set(f[key]);
      if (values.has(option)) values.delete(option);
      else values.add(option);
      return { ...f, [key]: Array.from(values) };
    });
    clearFeedback();
  };
  return { onFieldChange, onToggleList };
}
