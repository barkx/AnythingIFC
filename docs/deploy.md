# Deploying to Vercel

Two Vercel projects from the same GitHub repo (`barkx/AnythingIFC`), one Blob store, three domains.
Do the steps in order; each ends with a check.

| Vercel project | Root directory | Domain(s) |
|---|---|---|
| `ifcwise-www` | `apps/www` | `ifcwise.com`, `www.ifcwise.com` → redirect to `ifcwise.com` |
| `ifcwise-app` | `apps/app` | `app.ifcwise.com` |

## 1. Generate secrets (on your PC)

Run each line in a terminal and keep the output somewhere safe (a password manager). Use **new** values for
production — not the ones in your local `apps/app/.env.local`.

```bash
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('base64url'))"
node -e "console.log('ADMIN_API_TOKEN=' + require('crypto').randomBytes(32).toString('base64url'))"
node -e "console.log('EMAIL_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"
```

Also pick a long `ADMIN_PASSWORD` (20+ characters).

> `EMAIL_ENCRYPTION_KEY` must never change after the first project is created — creators' emails are encrypted
> with it. `SESSION_SECRET` can be rotated (it just logs the admin out).

## 2. Project `ifcwise-www` (landing page)

1. vercel.com → **Add New… ▸ Project** → import `barkx/AnythingIFC`.
2. **Project Name:** `ifcwise-www`.
3. **Root Directory:** *Edit* → `apps/www`. Framework preset: Next.js (detected).
   Leave build/install commands at their defaults; Vercel installs the npm workspaces from the repo root.
4. **Environment Variables** (Production + Preview):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://ifcwise.com` |
   | `NEXT_PUBLIC_APP_URL` | `https://app.ifcwise.com` |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | an address you actually read (e.g. `hello@ifcwise.com` once that mailbox exists) |

5. **Deploy.** ✅ The `*.vercel.app` URL shows the landing page.

## 3. Project `ifcwise-app` (projects + admin)

1. **Add New… ▸ Project** → import `barkx/AnythingIFC` again.
2. **Project Name:** `ifcwise-app`. **Root Directory:** `apps/app`.
3. Environment variables (Production + Preview):

   | Name | Value |
   |---|---|
   | `ADMIN_PASSWORD` | from step 1 |
   | `SESSION_SECRET` | from step 1 |
   | `ADMIN_API_TOKEN` | from step 1 |
   | `EMAIL_ENCRYPTION_KEY` | from step 1 |
   | `NEXT_PUBLIC_SITE_URL` | `https://ifcwise.com` |
   | `NEXT_PUBLIC_APP_URL` | `https://app.ifcwise.com` |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | same as www |

   `BLOB_READ_WRITE_TOKEN` is added automatically in step 4.
4. **Deploy** — the first build is expected to work but uploads will fail until the Blob store is connected.

## 4. Blob store

1. In `ifcwise-app` → **Storage** tab → **Create Database ▸ Blob**.
2. Name `ifcwise-projects`, region **Frankfurt (fra1)** if offered (EU data), access **Public** (the app stores
   files with `access: "public"`; private fields are encrypted/hashed).
3. **Connect** it to `ifcwise-app` for Production and Preview. This sets `BLOB_READ_WRITE_TOKEN`.
4. **Deployments ▸ … ▸ Redeploy** the latest deployment so it picks up the token.

✅ `https://<ifcwise-app>.vercel.app/api/health` returns `{"status":"ok"}`, and `/new` creates a draft project.

## 5. Domains

ifcwise.com already uses Vercel nameservers, so Vercel creates the DNS records itself.

1. `ifcwise-www` → **Settings ▸ Domains** → add `ifcwise.com`. When asked, also add `www.ifcwise.com` and choose
   **redirect www → ifcwise.com**.
2. `ifcwise-app` → **Settings ▸ Domains** → add `app.ifcwise.com`.
3. Wait for both to show **Valid Configuration** (usually minutes; certificates are issued automatically).
4. If you receive email at @ifcwise.com: **Domains ▸ ifcwise.com ▸ DNS Records** — re-create the MX (and SPF/DKIM)
   records from your old DNS provider, otherwise mail stops arriving.

✅ `https://ifcwise.com`, `https://www.ifcwise.com` (redirects) and `https://app.ifcwise.com` all load over HTTPS.

## 6. Local tools against production

`tools/ifc-tools/.env`:

```
IFCWISE_APP_URL=https://app.ifcwise.com
IFCWISE_ADMIN_TOKEN=<ADMIN_API_TOKEN from step 1>
IFCWISE_DATA_DIR=C:\IFCWiseData
```

✅ `npm run tools -- list` prints "Nothing waiting." (or your test project).

## 7. End-to-end test on production

1. `app.ifcwise.com/new` → create a project with a DXF, a PDF and a sketch → save the manage link.
2. `/admin` → log in → the project is under *Awaiting review* → **Approve & publish**.
3. `npm run tools -- pull <id>` → check `C:\IFCWiseData\jobs\<id>\PROMPT.md`.
4. Write a small `output/model-spec.json`, `npm run tools -- build <id>`.
5. Admin → upload `model.ifc`, `summary.json`, `assumptions.md` → **Upload & complete**.
6. Project page shows the viewer, summary and assumptions; the gallery lists the project.
7. Manage link → delete the project → it disappears from the gallery and Blob.

## Notes

- **Plan:** Vercel Hobby is free but for non-commercial use only — switch both projects' team to Pro before
  charging anything (PLAN.md §10).
- **Previews:** every push builds both projects; preview URLs are not indexed by search engines.
- **Rotating `ADMIN_API_TOKEN`:** change it in Vercel, redeploy, update `tools/ifc-tools/.env`.
