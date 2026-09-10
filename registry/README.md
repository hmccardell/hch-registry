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

**This project is designed to live in a subdirectory of the HCH website repo**
and be served at a subpath (`/registry`) of the main site rather than on its own
domain. Every route — the API, the health check, and the static bundle — is
mounted under that one prefix. The prefix is defined in three places that must
agree: `BASE_PATH` in `server/src/config.js` (runtime, overridable via env),
`base` in `frontend/vite.config.js` (baked in at build time), and the
reverse-proxy rule in front of the deployed service. See
[Integrating into the HCH website repo](#integrating-into-the-hch-website-repo).

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

Two terminals. Vite serves the app under `/registry/` and proxies `/registry/api`
to the server, so both sides run on one origin (matching production) and there is
no CORS or frontend env to set.

```bash
# terminal 1 — server
cd server
cp .env.example .env      # then fill it in (table below)
npm install
npm run dev               # http://localhost:4000/registry

# terminal 2 — frontend
cd frontend
npm install
npm run dev               # http://localhost:5173/registry/
```

`server/.env`:

| Variable | Value |
| --- | --- |
| `PORT` | `4000` unless taken. |
| `BASE_PATH` | Subpath everything mounts under. Default `/registry`; leave unset locally unless you also change `base` in `frontend/vite.config.js`. |
| `REGISTRY_AUTH_USER` / `REGISTRY_AUTH_PASSWORD` | The shared login. Any values locally. |
| `REGISTRY_AUTH_SECRET` | Any string locally. Generate a real one for prod: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `GOOGLE_SHEET_ID` | The ID in the sheet URL: `.../spreadsheets/d/`**`THIS`**`/edit`. |
| `GOOGLE_SHEET_RANGE` | The response tab's name, exactly (default `Form Responses 1`). |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON key. |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | `private_key` from the JSON key, pasted as-is (keep the `BEGIN`/`END` lines; real newlines or literal `\n` both work). |

Check <http://localhost:4000/registry/health> → `{"ok":true}`. A `500` from
`/registry/api/directory` means a `GOOGLE_*` value is off — the server terminal
shows the real error.

## Deploy to Render

One Node web service builds the frontend and serves it from the same process
that exposes the API — single origin, no CORS. Because this project sits in a
subdirectory, `render.yaml` sets `rootDir: registry` so the build/start commands
run from here.

1. Push the containing repo to GitHub.
2. In Render: **New → Blueprint**, point it at the repo. It reads
   [`render.yaml`](render.yaml) and creates the `hch-registry` service
   (build `npm run build`, start `npm start`, from `registry/`).
3. When prompted, set the secrets: `REGISTRY_AUTH_PASSWORD`, `GOOGLE_SHEET_ID`,
   `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
   `REGISTRY_AUTH_SECRET` is generated; `NODE_ENV`, `BASE_PATH`,
   `REGISTRY_AUTH_USER`, and `GOOGLE_SHEET_RANGE` have defaults in the blueprint.
4. Deploy. The service answers under `https://<service>.onrender.com/registry`.
   Put it behind the main site's reverse proxy so `hubcityhackers.com/registry/*`
   forwards here **without stripping the prefix** — the app owns the whole
   `/registry` path.

Notes:

- With `NODE_ENV=production` the server **refuses to start** unless
  `REGISTRY_AUTH_PASSWORD` and `REGISTRY_AUTH_SECRET` are set, so it can never
  ship on the built-in dev defaults.
- Render's free plan sleeps the service after ~15 min idle; the next request
  wakes it (a slow first load).
- The directory response is cached in memory for 60s, so an edit or deletion in
  the sheet can take up to a minute to appear.

## Integrating into the HCH website repo

This directory is self-contained: no path or config outside `registry/` is
referenced, so it can be dropped into the website repo as-is. To keep git
history, import it with a subtree rather than copying files:

```bash
# run from the website repo root
git subtree add --prefix=registry <this-repo-url> main --squash
# later, to pull registry updates:
git subtree pull --prefix=registry <this-repo-url> main --squash
```

Checklist once it's in:

- **Serving path.** The registry owns `/registry/*`. Add a reverse-proxy /
  rewrite rule that forwards that prefix to this service (or, if the site is
  also Node/Express, `app.use('/registry', registryRouter)` in-process). Don't
  strip the prefix. To serve it somewhere else, change `BASE_PATH` **and** `base`
  in `frontend/vite.config.js` together.
- **Deploy.** Either keep this as its own Render service using the `render.yaml`
  here (`rootDir: registry`), or copy the service block into the site's own
  blueprint. The build/start commands already scope themselves to this folder.
- **Env vars** are `REGISTRY_`-prefixed (`REGISTRY_AUTH_USER/PASSWORD/SECRET`)
  so they don't collide with the host site's own `AUTH_*`. `GOOGLE_*`, `PORT`,
  and `NODE_ENV` are unchanged — if the site already sets `NODE_ENV`/`PORT` in a
  shared environment group, that's fine; they mean the same thing here.
- **Node version.** `.node-version` pins 22 and every `package.json` says
  `engines.node >=22`. Match the site's toolchain or bump both together.
- **Workspaces.** `server/` and `frontend/` are independent packages with their
  own lockfiles. If the site uses npm/pnpm/yarn workspaces, add
  `registry/server` and `registry/frontend` (and optionally `registry/`) to its
  `workspaces` array; otherwise leave them standalone — the root `package.json`
  here just orchestrates `npm --prefix`.
- **Secrets.** `server/.env` is git-ignored and has never been committed; the
  subtree import carries no secrets. Recreate `.env` from `.env.example` in the
  new checkout for local dev.

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
