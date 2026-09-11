# Hub City Hackers — Member Registry

A private Supabase table holds member records (real emails and phone numbers); a
small Express server filters that table down to what each member agreed to show
publicly; a React app renders the result behind a shared password.

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
| `REGISTRY_AUTH_USER` / `REGISTRY_AUTH_PASSWORD` | The shared login. Any values locally. |
| `REGISTRY_AUTH_SECRET` | Any string locally. Generate a real one for prod: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `SUPABASE_URL` | Project Settings → Data API → Project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → `service_role` secret. Server-only. |
| `SUPABASE_MEMBERS_TABLE` | Only if the table isn't named `members`. |

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
3. When prompted, set the secrets: `REGISTRY_AUTH_PASSWORD`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`. `REGISTRY_AUTH_SECRET` is generated; `NODE_ENV`,
   `BASE_PATH`, and `REGISTRY_AUTH_USER` have defaults in the blueprint.
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
- **Env vars** are `REGISTRY_`-prefixed (`REGISTRY_AUTH_USER/PASSWORD/SECRET`)
  so they don't collide with the host site's own `AUTH_*`. `SUPABASE_*`, `PORT`,
  and `NODE_ENV` are unchanged — if the site already sets `NODE_ENV`/`PORT` in a
  shared environment group, that's fine; they mean the same thing here. If the
  host site also uses Supabase, keep these `SUPABASE_*` values scoped to this
  service unless both point at the same project.
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
- Tiered visibility (e.g. an authenticated members-only view) — every row is
  public.
- A way to contact someone who hid their email and phone.
- Splitting a checkbox "Other" free-text answer from real selections — a comma
  inside an "Other" answer stored as a plain string is still misread as multiple
  values (`toList` in `server/src/transform.js`). Native `text[]` columns avoid
  this.
