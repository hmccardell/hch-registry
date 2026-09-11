# Hub City Hackers — Member Registry

A private Supabase table holds member records (real emails and phone numbers); a
small Express server filters that table down to what each member agreed to show
publicly; a React app renders the result. Members sign in with a one-time link
emailed to the address already on their record — no passwords.

```
frontend/   Vite + React + Tailwind — the directory UI
server/     Express — reads the table, applies the privacy rules, serves JSON,
            and (in production) serves the built frontend
```

The frontend never touches Supabase. It only ever sees what the server chooses
to expose, and only the server holds the Supabase key.

**This project is designed to live in a subdirectory of the HCH website repo**
and be served at a subpath (`/registry`) of the main site rather than on its own
domain. Every route — the API, the health check, and the static bundle — is
mounted under that one prefix. The prefix is defined in three places that must
agree: `BASE_PATH` in `server/src/config.js` (runtime, overridable via env),
`base` in `frontend/vite.config.js` (baked in at build time), and the
reverse-proxy rule in front of the deployed service. See
[Integrating into the HCH website repo](#integrating-into-the-hch-website-repo).

## One-time Supabase setup

The server reads the table with the project's **service-role key** — a
server-only secret that bypasses row-level security. The table stays private
(RLS on, no public policies) so the anon/public key can never read it.

1. **Create the table.** In the Supabase dashboard → **SQL Editor**, run:

   ```sql
   create table members (
     id            uuid primary key default gen_random_uuid(),
     created_at    timestamptz not null default now(),
     name          text,
     email         text,
     phone         text,
     show_email    boolean not null default false,
     show_phone    boolean not null default false,
     discord_handle text,
     links         text,
     skills        text[] not null default '{}',
     project_name  text,
     project_description text,
     project_stage text,
     project_link  text,
     help_offered  text[] not null default '{}',
     needs         text[] not null default '{}',
     needs_detail  text,
     bio           text
   );

   alter table members enable row level security;
   -- No policies: the service-role key (server only) still has full access;
   -- the anon/public key gets nothing.
   ```

2. **Grab the credentials.** *Project Settings → Data API* → copy the **Project
   URL**. *Project Settings → API Keys* → copy the **`service_role`** secret.
   Treat that key like a password — it can read and write every table.

3. **Load the data.** Import existing members via the dashboard's **Table
   Editor → Insert → Import data from CSV**, or paste `insert` statements in the
   SQL Editor. `show_email` / `show_phone` are booleans; `skills`,
   `help_offered`, and `needs` are Postgres text arrays (`{"a","b"}` in CSV).

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
| `PUBLIC_URL` | Leave unset locally — the sign-in link is built from the request origin. |
| `REGISTRY_AUTH_SECRET` | Any string locally. Generate a real one for prod: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `SMTP_URL` | Leave unset locally — sign-in links print to the server terminal instead of being emailed. |
| `MAIL_FROM` | Only matters once `SMTP_URL` is set. |
| `SUPABASE_URL` | Project Settings → Data API → Project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → `service_role` secret. Server-only. |
| `SUPABASE_MEMBERS_TABLE` | Only if the table isn't named `members`. |

To sign in locally: enter an email that exists in the `members` table, then open
the link the **server terminal** prints (`[mailer] dev mode — sign-in link…`).

Check <http://localhost:4000/registry/health> → `{"ok":true}`. A `500` from
`/registry/api/directory` means a `SUPABASE_*` value is off or the table name
doesn't match — the server terminal shows the real error.

## Deploy to Render

One Node web service builds the frontend and serves it from the same process
that exposes the API — single origin, no CORS. Because this project sits in a
subdirectory, `render.yaml` sets `rootDir: registry` so the build/start commands
run from here.

1. Push the containing repo to GitHub.
2. In Render: **New → Blueprint**, point it at the repo. It reads
   [`render.yaml`](render.yaml) and creates the `hch-registry` service
   (build `npm run build`, start `npm start`, from `registry/`).
3. When prompted, set the secrets: `PUBLIC_URL` (where members reach the
   registry, e.g. `https://hubcityhackers.com/registry`), `SMTP_URL` (a
   transactional-email provider), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
   `REGISTRY_AUTH_SECRET` is generated; `NODE_ENV`, `BASE_PATH`, and `MAIL_FROM`
   have defaults in the blueprint.
4. Deploy. The service answers under `https://<service>.onrender.com/registry`.
   Put it behind the main site's reverse proxy so `hubcityhackers.com/registry/*`
   forwards here **without stripping the prefix** — the app owns the whole
   `/registry` path.

Notes:

- With `NODE_ENV=production` the server **refuses to start** unless
  `REGISTRY_AUTH_SECRET` is set, and **refuses to send** (returns 503 on
  sign-in) unless `SMTP_URL` is set — it can never ship on the dev defaults or
  silently print links to the logs.
- Render's free plan sleeps the service after ~15 min idle; the next request
  wakes it (a slow first load).
- The directory response is cached in memory for 60s, so an edit or deletion in
  the table can take up to a minute to appear.

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
- **Env vars**: `REGISTRY_AUTH_SECRET` is `REGISTRY_`-prefixed so it doesn't
  collide with the host site's own `AUTH_*`. `SUPABASE_*`, `SMTP_URL`,
  `MAIL_FROM`, `PUBLIC_URL`, `PORT`, and `NODE_ENV` are unchanged — if the site
  already sets `NODE_ENV`/`PORT` in a shared environment group, that's fine.
  Keep `SUPABASE_*` scoped to this service unless the host site points at the
  same project; likewise `SMTP_URL` if the site sends its own mail.
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

## How sign-in works

No passwords. The only credential is control of an email address that already
appears in the `members` table.

1. **Request** — `POST /api/auth/request-link { email }`
   ([`index.js`](server/src/index.js)). The server checks the address against the
   `email` column ([`memberExistsByEmail`](server/src/supabase.js), case-
   insensitive) and, if it matches, emails a link
   ([`mailer.js`](server/src/mailer.js)) containing a signed, 15-minute token
   ([`issueMagicToken`](server/src/auth.js)). The response is an identical `200`
   either way — it's not an oracle for who's a member. Rate-limited to 5 per 15
   minutes per IP.
2. **Redeem** — the link hits `GET /api/auth/callback?token=…`, which verifies
   the token, records its `jti` so it can't be used twice, mints a 12-hour
   session token, and redirects to the app with it in the URL *fragment*
   (`#token=…`). The fragment is never sent to a server; the app reads it once
   and strips it ([`takeAuthResultFromUrl`](frontend/src/lib/auth.js)).
3. **Use** — the app stores the session token and sends it as
   `Authorization: Bearer` on every `/api/directory` call
   ([`requireAuth`](server/src/auth.js)).

Magic-link and session tokens are both HMAC-signed with `REGISTRY_AUTH_SECRET`
but domain-separated by a label, so one can't be replayed as the other. The
single-use `jti` set is in-memory — fine for one instance, not for several.

## How the privacy filtering works

`server/src/transform.js` maps table columns to field names via
`COLUMN_TO_FIELD`, then `toPublicMember()`:

- Every row in the table is listed — there is no "keep me out" column, so being
  in the table is the opt-in.
- `email` is nulled unless `show_email` is true.
- `phone` is nulled unless `show_phone` is true.

**Renaming a column breaks its mapping in `COLUMN_TO_FIELD`** — the field then
silently vanishes from the API rather than erroring. Keep those keys in sync
with the table.

## Not built yet (out of scope for this base)

- **Member intake.** The old Google Form that fed the sheet no longer connects
  to anything. Rows go in through the Supabase dashboard (or whatever you build
  to write to the table). A public submission form and an "edit my entry" flow
  are not part of this.
- **Registration / approval.** Adding someone is a manual table insert. There's
  no "apply → an admin approves → you can now sign in" flow, no admin UI, and no
  way for a member to change the email they sign in with.
- **Sign-in hardening.** The single-use link guard (`jti`) is in-memory, so it
  resets on redeploy and doesn't hold across multiple instances — a shared store
  (Redis, or a Supabase table) is needed for that. The session token also rides
  in the redirect URL fragment; swapping that for a one-time exchange code would
  keep it out of the URL entirely. No "sign out everywhere" / revocation short
  of rotating `REGISTRY_AUTH_SECRET`.
- **Email delivery.** `SMTP_URL` is raw SMTP with no retry/bounce handling,
  DKIM/SPF setup, or templated HTML — just a plain-text link.
- **Case/format-exact email match.** `memberExistsByEmail` lowercases and does a
  literal `ILIKE`; a `citext` column or stored-normalized address would be
  sturdier than matching on a free-text `text` column.
- Tiered visibility (e.g. an authenticated members-only view) — every row is
  public.
- A way to contact someone who hid their email and phone.
- Splitting a checkbox "Other" free-text answer from real selections — a comma
  inside an "Other" answer stored as a plain string is still misread as multiple
  values (`toList` in `server/src/transform.js`). Native `text[]` columns avoid
  this.
