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
     website       text,
     github        text,
     linkedin      text,
     skills        text[] not null default '{}',
     help_offered  text[] not null default '{}',
     needs         text[] not null default '{}',
     needs_detail  text,
     bio           text,
     published     boolean not null default false
   );

   -- One row per address, case-insensitively — this is the sign-in key.
   create unique index members_email_lower_key on members (lower(email));

   alter table members enable row level security;
   -- No policies: the service-role key (server only) still has full access;
   -- the anon/public key gets nothing.
   ```

   If the table already exists from an earlier schema, add the new link columns
   (leave unused `links` / `project_*` columns in place until you migrate them):

   ```sql
   alter table members
     add column if not exists website text,
     add column if not exists github text,
     add column if not exists linkedin text;
   ```

2. **Grab the credentials.** *Project Settings → Data API* → copy the **Project
   URL**. *Project Settings → API Keys* → copy the **`service_role`** secret.
   Treat that key like a password — it can read and write every table.

3. **Load the data.** Import existing members via the dashboard's **Table
   Editor → Insert → Import data from CSV**, or paste `insert` statements in the
   SQL Editor. `show_email` / `show_phone` and `published` are booleans;
   `skills`, `help_offered`, and `needs` are Postgres text arrays (`{"a","b"}`
   in CSV). Set `published = true` on rows that should appear in the directory
   immediately — see [Adding a member](#adding-a-member) for the normal path.

## Adding a member

Adding someone is a one-field insert — save this as a SQL Editor **snippet**
("Add member") and just edit the email each time:

```sql
insert into members (email)
values (lower(trim('PASTE_EMAIL_HERE')))
returning id, email, created_at;
```

That's the entire admin action. The person can request a sign-in link right
away; they land on an empty profile (`/#/profile`) and fill in their own name,
skills, bio, etc. They won't show up in the public directory until they save
their profile with **"List me in the public directory"** checked — see
[How self-service profiles work](#how-self-service-profiles-work). Removing
someone is `delete from members where email = '...'`.

## Local development

Use **http://localhost:5173/registry/** — Vite is the app. Express on `:4000`
is API-only; Vite proxies `/registry/api` there. Opening `:4000` in a browser
redirects to Vite so sign-in links don't dump you on a dead port.

```bash
cd registry
cp server/.env.example server/.env   # then fill it in (table below)
npm run install:all
npm run dev                          # API :4000 + app :5173
```

Or two terminals (`npm run dev` in `server/` and `frontend/`) if you prefer
the logs split. Either way, stay on `:5173`. Vite uses `strictPort`, so if
5173 is already taken, kill the leftover process instead of hopping ports.

With `SMTP_URL` unset, submitting the login form follows the magic-link
callback in the same tab (no copying a URL out of the server log). The
server still prints the link if you need it.

`server/.env`:

| Variable | Value |
| --- | --- |
| `PORT` | `4000` unless taken. |
| `BASE_PATH` | Subpath everything mounts under. Default `/registry`; leave unset locally unless you also change `base` in `frontend/vite.config.js`. |
| `PUBLIC_URL` | Leave unset locally — sign-in links go to Vite (`DEV_FRONTEND_URL`). |
| `REGISTRY_AUTH_SECRET` | Any string locally. Generate a real one for prod: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `SMTP_URL` | Leave unset locally — sign-in links print to the server terminal instead of being emailed. |
| `MAIL_FROM` | Only matters once `SMTP_URL` is set. |
| `SUPABASE_URL` | Project Settings → Data API → Project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → `service_role` secret. Server-only. |
| `SUPABASE_MEMBERS_TABLE` | Only if the table isn't named `members`. |

To sign in locally: enter an email that exists in the `members` table. The
browser should bounce through the callback and land you in the app. If it
doesn't, the server terminal still prints `[mailer] dev mode — sign-in link…`.

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

## How self-service profiles work

An admin only ever provides an email ([Adding a member](#adding-a-member)); the
member fills in the rest themselves at `/#/profile`.

- **`GET /api/me`** ([`index.js`](server/src/index.js)) returns the signed-in
  member's own row, unredacted. It's found by `req.user.email` — the email
  `requireAuth` already pulled out of the session token — never by an id the
  client sends, so there is no way to ask for someone else's row.
- **`PATCH /api/me`** writes an update to that same row. The request body is
  passed through `sanitizeProfileInput()`
  ([`transform.js`](server/src/transform.js)) first, which keeps only a fixed
  whitelist of profile fields (name, phone, website / GitHub / LinkedIn, skills,
  bio, the `show_email` / `show_phone` / `published` toggles, …) and coerces
  each to the right type. Anything else in the body — `email`, `id`, or a field
  that doesn't exist — is silently dropped rather than reaching the database.
  **`email` is never writable through this endpoint**; it's the sign-in key; a
  member can't quietly redirect their own login target through a profile edit.
- **`published`** gates the *row*, separately from `show_email` / `show_phone`,
  which gate *columns* on rows that are already visible. A bare, admin-added
  row defaults to `published = false` and is invisible in `/api/directory`
  until the member saves their profile with that box checked.

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

- **Public intake / approval queue.** Adding a member is still a manual insert
  by someone with SQL Editor access ([Adding a member](#adding-a-member)) — there
  is no public "apply" form and no admin approval UI; the old Google Form that
  fed the original sheet no longer connects to anything.
- **Changing your own email.** Self-service editing covers every other field
  (see [How self-service profiles work](#how-self-service-profiles-work)), but
  not the email itself — that's the sign-in key, so changing it needs more care
  (verifying the new address before it takes effect) than a plain field edit.
- **An admin role / admin UI.** Every signed-in member can edit only their own
  row; there's no `is_admin` flag or admin-only view (e.g. a list of
  unpublished / newly added members) — that's still the SQL Editor.
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
