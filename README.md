# Hub City Hackers — Member Registry

Base scaffold for the HCH member directory: a Google Form feeds a Google Sheet
(private, has real emails/phones), a small server filters that sheet down to
what each member agreed to make public, and a React app renders the result.

```
frontend/   Vite + React + Tailwind — renders the public directory
server/     Express — reads the raw sheet, applies the Q8-10 privacy rules, serves JSON
```

The frontend never talks to Google Sheets directly. It only ever sees what
`server` decides to expose.

## Setup

This walks through everything needed to get real data flowing, in order.
Steps 2-5 are all inside [Google Cloud Console](https://console.cloud.google.com/)
and only need to be done once.

### 1. Create the Google Form

Use the form draft to build it in Google Forms. In the form editor go to
**Settings → Responses** and turn on **"Collect email addresses"** — this is
what gives each submitter a self-service "edit your response" link later, so
you don't need to build any custom login/auth for people to update their info.

Then, in the **Responses** tab of the form, click the green Sheets icon
("View responses in Sheets" / "Create Spreadsheet") to create the linked
Google Sheet. This sheet is your private source of truth — it has everyone's
real email/phone regardless of what they chose to make public.

### 2. Create a Google Cloud project

The server authenticates to Google as a "service account" — a robot identity
that can read one specific sheet, nothing else on your Google account.

1. Go to [console.cloud.google.com](https://console.cloud.google.com/).
2. Top-left, click the project dropdown → **New Project**.
3. Name it something like `hch-registry` → **Create**.
4. Make sure that project is selected in the dropdown before continuing.

### 3. Enable the Google Sheets API

1. In the left sidebar (or search bar at top), go to **APIs & Services → Library**.
2. Search for **Google Sheets API**.
3. Click it, then click **Enable**.

### 4. Create the service account and its key

1. Go to **APIs & Services → Credentials**.
2. Click **+ Create Credentials → Service account**.
3. Give it any name, e.g. `hch-registry-sheets-reader` → **Create and Continue**.
4. You can skip granting it a project role (click **Continue**, then **Done**)
   — access will come from sharing the sheet directly with it, not from a
   project-wide role.
5. On the Credentials page, click into the service account you just made.
6. Go to the **Keys** tab → **Add Key → Create new key** → choose **JSON** → **Create**.
7. A `.json` file downloads. **Treat this file like a password** — don't
   commit it, don't share it. Open it in a text editor; you'll need two
   fields out of it in a minute:
   - `"client_email"` — a long address ending in `.iam.gserviceaccount.com`
   - `"private_key"` — a long string starting with `-----BEGIN PRIVATE KEY-----`

### 5. Share the Sheet with the service account

1. Open the response Sheet from step 1.
2. Click **Share** (top right).
3. Paste in the `client_email` value from the downloaded JSON.
4. Set its role to **Viewer**.
5. Untick "Notify people" (it's a robot account, no need to email it) → **Share**.

Without this step the server will get a permissions error — enabling the API
and having a key isn't enough, the sheet itself must be shared with that exact
service account email.

### 6. Configure the server's `.env`

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in each value:

| Variable | What goes here |
| --- | --- |
| `PORT` | Leave as `4000` unless that port is already in use on your machine. |
| `CORS_ORIGIN` | Leave as `http://localhost:5173` for local dev — it's the URL of the frontend, used so the browser will accept the server's responses. |
| `GOOGLE_SHEET_ID` | From the Sheet's URL: `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`. Copy just that long ID string, nothing else. |
| `GOOGLE_SHEET_RANGE` | The name of the tab (bottom of the Sheet) that holds form responses. Google names it `Form Responses 1` by default — check the actual tab name in your sheet and match it exactly, it's case-sensitive. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The `client_email` value from the downloaded JSON key, pasted exactly as-is. |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | The `private_key` value from the downloaded JSON key, pasted exactly as-is — **including** the `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----` lines and the literal `\n` characters in between. Don't convert those `\n`s into real line breaks; the server does that conversion itself. It's normal for this to be one very long line in the `.env` file. |

Then install and run it:

```bash
npm install
npm run dev
```

Visit http://localhost:4000/api/directory in your browser — you should see a
JSON array (empty `[]` is fine if the form has no public-visibility responses
yet). An error there means one of the values above is off; see
Troubleshooting below.

### 7. Configure the frontend's `.env`

```bash
cd frontend
cp .env.example .env
```

| Variable | What goes here |
| --- | --- |
| `VITE_API_URL` | The URL where the server from step 6 is running. Leave as `http://localhost:4000` for local dev. |

Then install and run it:

```bash
npm install
npm run dev
```

### 8. Open it

http://localhost:5173

### Troubleshooting

- **"Failed to load directory" in the browser, or a 500 from `/api/directory`**
  — check the server's terminal output for the real error.
- **Permission / 403 error from Google** — the sheet hasn't been shared with
  the service account's exact `client_email` (step 5), or you're pointing at
  the wrong `GOOGLE_SHEET_ID`.
- **"Unable to parse range" error** — `GOOGLE_SHEET_RANGE` doesn't match the
  actual tab name in the sheet (check for a trailing space or a different
  number, e.g. `Form Responses 2`).
- **A JWT / "invalid_grant" / signature error** — usually means
  `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` got mangled when pasted (missing the
  `\n` sequences, or they got converted into real newlines by an editor).
  Re-copy it straight from the JSON file as one line.

## How the privacy filtering works

`server/src/transform.js` maps sheet columns by header text (matching the
live form's exact question wording), then `toPublicMember()`:

- Everyone who submits the form ends up in the public directory — there's no
  "keep me out entirely" question on the live form, so submitting is itself
  the opt-in.
- Nulls out `email` unless they answered "Yes, show my email".
- Nulls out `phone` unless they answered "Yes" to the phone question.

**If you reword, add, or remove a question on the live form, `HEADER_TO_FIELD`
in that file will stop matching it** — the field just silently disappears
from the API response instead of erroring, so it's easy to miss. Keep the
keys in `HEADER_TO_FIELD` in sync with the form's actual current wording.

## Not built yet (out of scope for this base)

- Any tiered visibility (e.g. a "members-only" authenticated view) — the live
  form has no opt-out-of-the-directory question, so everyone who submits is public.
- A way to message someone who's hidden their email/phone.
- Splitting a checkbox question's "Other" free-text answer from its real
  selections — right now a comma inside an "Other" answer gets misread as
  multiple values (see `splitList` in `server/src/transform.js`).
- Editing the "collect email addresses" edit-link mechanism into the app itself
  (currently Google handles it entirely on the Forms side).
