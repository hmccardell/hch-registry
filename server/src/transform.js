// Maps the exact Google Form question text (becomes the sheet's header row) to an
// internal field name. This must match the LIVE form's actual wording — it will
// drift from the original form draft as questions get reworded/added/removed, so
// if a question's wording changes, update the key here to match.
const HEADER_TO_FIELD = {
  'Email Address': 'email', // Forms' auto-added column (from "Collect email addresses"), not a manual question
  'Show your email in the public directory?': 'showEmail',
  "What's your name?": 'name',
  "What's your phone number?": 'phone',
  'Show your phone number in the HCH directory?': 'showPhone',
  "What's your Discord Handle?": 'discordHandle',
  "LinkedIn / GitHub / Portfolio Site... MySpace? Whatever you've got, just do it one per line.":
    'links',
  "You've got skills, check all that apply.": 'skills',
  'Project name': 'projectName',
  'One-line project description': 'projectDescription',
  Stage: 'projectStage',
  'Project link': 'projectLink',
  'Ways you can help others (select all that apply)': 'helpOffered',
  'What are you looking for? (Select all that apply)': 'needs',
  'Any specific needs?  Be as detailed as you want, odd asks are welcome.': 'needsDetail',
  "Is there anything else you'd like members to know about you?": 'bio',
};

const LIST_FIELDS = new Set(['skills', 'helpOffered', 'needs']);

function splitList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Turns the raw [header row, ...dataRows] values from Sheets into an array of
// { field: value } records, using header text (not column position) so reordering
// or inserting columns in the live sheet doesn't break the mapping.
export function buildRecords(rows) {
  if (rows.length === 0) return [];
  const [headerRow, ...dataRows] = rows;
  const fieldByColumn = headerRow.map((header) => HEADER_TO_FIELD[header.trim()] || null);

  return dataRows
    .filter((row) => row.some((cell) => cell))
    .map((row) => {
      const record = {};
      fieldByColumn.forEach((field, i) => {
        if (!field) return;
        record[field] = LIST_FIELDS.has(field) ? splitList(row[i]) : row[i] || '';
      });
      return record;
    });
}

// The live form has no "are you visible publicly at all" question — every
// submission is, by design, headed into the public directory. The only
// member-controlled redaction is per-field: email/phone are nulled out unless
// the member opted in via the "Show your email/phone..." questions.
export function toPublicMember(record) {
  const { email, phone, showEmail, showPhone, ...rest } = record;
  return {
    ...rest,
    email: showEmail === 'Yes, show my email' ? email : null,
    phone: showPhone === 'Yes' ? phone : null,
  };
}
