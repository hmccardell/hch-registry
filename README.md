# Hub City Hackers — Member Registry

A Google Form feeds a private Google Sheet (real emails and phone numbers); a
small Express server filters that sheet down to what each member agreed to show
publicly; a React app renders the result behind a shared password.

```
frontend/   Vite + React + Tailwind — the directory UI
server/     Express — reads the sheet, applies the privacy rules, serves JSON,
            and (in production) serves the built frontend
```

The frontend never touches Google Sheets. It only ever sees what the server
chooses to expose.

## One-time Google setup

The server reads the sheet as a **service account** — a robot Google identity
that can see one specific sheet and nothing else.

1. **Form → Sheet.** Build the form in Google Forms. Under **Settings →
   Responses**, turn on **Collect email addresses** (this gives each submitter a
   self-service "edit your response" link — no custom login needed for edits).
   In the form's **Responses** tab, click the Sheets icon to create the linked
   spreadsheet. That sheet is the private source of truth.
2. **Cloud project.** At [console.cloud.google.com](https://console.cloud.google.com/),
   create a project (e.g. `hch-registry`) and select it.
3. **Enable the API.** *APIs & Services → Library →* search **Google Sheets
   API** *→ Enable*.
4. **Service account + key.** *APIs & Services → Credentials → Create
   Credentials → Service account*. Skip the optional role grant. Open the new
   account → **Keys → Add Key → Create new key → JSON**. A `.json` file
   downloads — treat it like a password. You need two fields from it:
   `client_email` and `private_key`.
5. **Share the sheet.** Open the response sheet → **Share** → paste the
   `client_email` → role **Viewer** → untick "Notify" → Share. Without this the
   server gets a 403, even with a valid key.

## Local development

Two terminals. The frontend proxies `/api` to the server, so both sides run on
one origin (matching production) and there is no CORS or frontend env to set.

```bash
# terminal 1 — server
cd server
cp .env.example .env      # then fill it in (table below)
npm install
npm run dev               # http://localhost:4000

# terminal 2 — frontend
cd frontend
npm install
npm run dev               # http://localhost:5173
```

`server/.env`:

| Variable | Value |
| --- | --- |
| `PORT` | `4000` unless taken. |
| `AUTH_USER` / `AUTH_PASSWORD` | The shared login. Any values locally. |
| `AUTH_SECRET` | Any string locally. Generate a real one for prod: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `GOOGLE_SHEET_ID` | The ID in the sheet URL: `.../spreadsheets/d/`**`THIS`**`/edit`. |
| `GOOGLE_SHEET_RANGE` | The response tab's name, exactly (default `Form Responses 1`). |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON key. |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | `private_key` from the JSON key, pasted as-is (keep the `BEGIN`/`END` lines; real newlines or literal `\n` both work). |

Check <http://localhost:4000/health> → `{"ok":true}`. A `500` from
`/api/directory` means a `GOOGLE_*` value is off — the server terminal shows the
real error.

## Deploy to Render

One Node web service builds the frontend and serves it from the same process
that exposes `/api` — single origin, no CORS.

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, point it at the repo. It reads
   [`render.yaml`](render.yaml) and creates the `hch-registry` service
   (build `npm run build`, start `npm start`).
3. When prompted, set the secrets: `AUTH_PASSWORD`, `GOOGLE_SHEET_ID`,
   `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
   `AUTH_SECRET` is generated; `NODE_ENV`, `AUTH_USER`, and `GOOGLE_SHEET_RANGE`
   have defaults in the blueprint.
4. Deploy. The app is at `https://<service>.onrender.com`.

Notes:

- With `NODE_ENV=production` the server **refuses to start** unless
  `AUTH_PASSWORD` and `AUTH_SECRET` are set, so it can never ship on the
  built-in dev defaults.
- Render's free plan sleeps the service after ~15 min idle; the next request
  wakes it (a slow first load).
- The directory response is cached in memory for 60s, so an edit or deletion in
  the sheet can take up to a minute to appear.

## How the privacy filtering works

`server/src/transform.js` maps sheet columns by **header text** (the form's
exact question wording), then `toPublicMember()`:

- Everyone who submits is listed — the live form has no "keep me out" option, so
  submitting is the opt-in.
- `email` is nulled unless the member answered "Yes, show my email".
- `phone` is nulled unless they answered "Yes" to the phone question.

**Rewording, adding, or removing a form question breaks its mapping in
`HEADER_TO_FIELD`** — the field then silently vanishes from the API rather than
erroring. Keep those keys in sync with the live form.

## Not built yet (out of scope for this base)

- Tiered visibility (e.g. an authenticated members-only view) — the form has no
  opt-out question, so every submitter is public.
- A way to contact someone who hid their email and phone.
- Splitting a checkbox "Other" free-text answer from real selections — a comma
  inside an "Other" answer is currently misread as multiple values (`splitList`
  in `server/src/transform.js`).
- Rate limiting on the login endpoint.
