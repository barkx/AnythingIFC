# TASKS

Source of truth for progress. Agents: take the first unchecked task in the current phase,
tick it when done (`- [x]`), and add a short note after it if useful. Details for each phase are in [PLAN.md](PLAN.md).

**Current phase: 2 — Projects on Blob**

---

## Phase 0 — Foundations
- [x] PLAN.md (v3: public projects on Vercel Blob, local computation)
- [x] AGENTS.md, CLAUDE.md, TASKS.md, docs/DECISIONS.md
- [x] Claude Code config: `.claude/launch.json`, `/next-task` command
- [ ] `.claude/settings.json` permission allowlist _(needs the user to approve; see docs/claude-settings.example.json)_
- [x] Root: `package.json` (npm workspaces), `.gitignore`, `.editorconfig`, `.nvmrc`, README.md
- [x] `apps/www` Next.js + TypeScript + Tailwind, placeholder page on :3000
- [x] `apps/app` Next.js + TypeScript + Tailwind, placeholder page + `/api/health` on :3001
- [x] `packages/shared` with job statuses, user types, file limits
- [x] `tools/ifc-tools` uv project with `typer` CLI skeleton (`prepare`, `validate` stubs)
- [x] `npm run build`, `npm run typecheck`, `npm run lint` pass; both apps open in the browser
- [x] `git init` (branch `main`)
- [x] First local commit
- [x] GitHub remote: https://github.com/barkx/AnythingIFC (public) — push at end of session

## Phase 1 — Landing page (`apps/www`)
- [x] Brand basics: wordmark, colour tokens, typography (light + dark)
- [x] Hero: "From drawings to IFC" + primary CTA
- [x] How it works (Upload → We model → Download IFC)
- [x] Supported inputs + what LOD 100–200 contains
- [x] Use cases: architects, contractors, homeowners, facility managers
- [x] FAQ (what is IFC, turnaround, privacy, retention)
- [x] ~~Request-access form~~ replaced by "Start a project" / "Browse projects" CTAs (public projects, PLAN v3)
- [x] Privacy policy, terms, imprint pages (placeholders for legal entity) — drafts, need legal review + company details in `src/lib/site.ts`
- [x] SEO: metadata, Open Graph image, favicon, sitemap, robots
- [x] Mobile check at 375 px

## Phase 2 — Projects on Blob (`apps/app`)
- [x] Add `@vercel/blob`, `zod`, `server-only`
- [ ] Connect a Blob store locally: create a store in Vercel → Storage, put `BLOB_READ_WRITE_TOKEN` in `apps/app/.env.local` _(user)_
- [x] `packages/shared`: `PublicProject`, `ProjectFile`, `ProjectEvent`, statuses (+ `draft`), building types
- [x] `lib/crypto.ts`: AES-256-GCM email encryption, manage tokens + SHA-256 hash, project IDs, IP hash
- [x] `lib/blob-paths.ts`: path helpers, filename sanitising, allowed types
- [x] `lib/projects.ts`: read (origin, no CDN cache) / write with `ifMatch` / update with retry / public serialiser / delete
- [x] `/new` form: project fields, display name, email, honeypot, consent checkboxes, file picker with progress
- [x] `/api/upload` client-upload token handler: manage-token check, path prefix, file type, size, file count
- [x] Submit flow: `createProject` (draft) → browser uploads to Blob → `attachFiles` verifies with `head()` → submitted; links shown once
- [x] `/p/[id]` project page (status, description, files, history); `noindex` for now
- [x] `/p/[id]/manage?t=…`: finish draft, reply to admin message, add files, edit details, delete
- [x] Per-IP limit on project creation (3/day, marker blobs under `ratelimit/`)
- [ ] End-to-end test with a real Blob store: create with files, view, manage, add files, edit, delete

## Phase 3 — Public gallery
- [ ] `/` gallery of published projects (cached, revalidated on every write)
- [ ] Filters by status and building type; empty state
- [ ] Thumbnails (`output/preview.png` or first image input)
- [ ] Sitemap + Open Graph for published projects
- [ ] "Report this project" link (mailto admin)

## Phase 4 — Admin
- [ ] `ADMIN_PASSWORD` login, signed session cookie, logout; `/admin*` protected
- [ ] Queue: unapproved first, then by age; counts per status
- [ ] Project detail: decrypted email, approve/unpublish, set status, public message, delete
- [ ] Upload outputs (`model.ifc`, `summary.json`, `assumptions.md`, `preview.png`) via client upload → mark completed
- [ ] `/api/admin/projects` + `/api/admin/projects/[id]` with `ADMIN_API_TOKEN` bearer auth
- [ ] Optional Resend emails: admin on new project; creator on needs_info / completed

## Phase 5 — Viewer
- [ ] That Open Engine viewer component (load IFC from Blob URL, orbit, fit, storey filter)
- [ ] Summary table from `summary.json`; render `assumptions.md`
- [ ] Download buttons (IFC + inputs)
- [ ] Viewer performance check with a 50 MB IFC

## Phase 6 — Local tools (`tools/ifc-tools`)
- [ ] Add `httpx`, `ezdxf`, `pymupdf`, `ifcopenshell`, `jinja2`
- [ ] `list` and `pull <id>` (admin API → `C:\IFCWiseData\jobs\<id>\`, `job.json`)
- [ ] `prepare`: DXF → JSON, PDF → PNG, render `PROMPT.md`
- [ ] `validate`: rules from PLAN.md §8 → `output/summary.json`
- [ ] Fixtures + pytest

## Phase 7 — Conversion toolkit
- [ ] `docs/SOP-conversion.md` (Route A + B)
- [ ] `docs/revit-ifc-export.md` + saved IFC export setup
- [ ] Revit template with IFC-mapped types (kept out of the public repo)
- [ ] Bonsai/IfcOpenShell starter script
- [ ] 3 test projects per input type on both routes; results in `docs/test-runs.md`

## Phase 8 — Go live
- [ ] Push to GitHub (barkx/AnythingIFC)
- [ ] Vercel project `ifcwise-www` (root `apps/www`) and `ifcwise-app` (root `apps/app`)
- [ ] Create Vercel Blob store, connect to `ifcwise-app`; set env vars (PLAN.md §12)
- [x] DNS: ifcwise.com nameservers → Vercel (ns1/ns2.vercel-dns.com, set 2026-10-27)
- [ ] Add domains in Vercel: `ifcwise.com` + `www` (redirect) → ifcwise-www; `app.ifcwise.com` → ifcwise-app
- [ ] Fill legal entity details; review privacy/terms
- [ ] Soft launch: 10 test projects, share gallery
