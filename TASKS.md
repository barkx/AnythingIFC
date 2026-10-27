# TASKS

Source of truth for progress. Agents: take the first unchecked task in the current phase,
tick it when done (`- [x]`), and add a short note after it if useful. Details for each phase are in [PLAN.md](PLAN.md).

**Current phase: 8 — Go live** (Phases 2–6 need an end-to-end test with a Blob token; Phase 7 needs test runs in Revit)

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
- [x] `/` gallery of published projects (`use cache` + `cacheTag("projects")`, invalidated with `updateTag` on every write)
- [x] Filters by status and building type (query string, no client JS); empty states
- [x] Thumbnails (`output/*.png` or first image input) via `next/image` with Blob remote pattern
- [x] Sitemap of published projects, robots.txt, per-project metadata (indexed only when listed)
- [x] "Report this project" link (mailto `NEXT_PUBLIC_CONTACT_EMAIL`)

## Phase 4 — Admin
- [x] `ADMIN_PASSWORD` login (rate-limited), HMAC-signed session cookie (7 days), logout
- [x] `/admin*` protected: `proxy.ts` optimistic redirect + `requireAdmin()` on the server
- [x] Queue: awaiting review first (oldest first), counts per status, age
- [x] Project detail: decrypted email, approve/unpublish, set status + note, public message / ask question (→ needs_info), delete
- [x] Upload outputs via client upload (admin cookie checked in `/api/upload`) → "Upload & complete"; remove outputs
- [x] `/api/admin/projects` + `/api/admin/projects/[id]` with `ADMIN_API_TOKEN` bearer auth (no email in responses)
- [ ] Set `ADMIN_PASSWORD` in `apps/app/.env.local` _(user)_
- [ ] End-to-end test with Blob token: login, approve, ask question, creator reply, upload outputs, gallery shows project, delete
- [ ] Optional Resend emails: admin on new project; creator on needs_info / completed

## Phase 5 — Viewer
- [x] That Open Engine viewer (`components/ifc-viewer.tsx`): load IFC from URL, orbit/zoom/pan, fit, storey isolation
- [x] Self-hosted assets: `scripts/copy-viewer-assets.mjs` copies fragments worker + web-ifc WASM to `public/vendor` (pre-dev/pre-build)
- [x] Version pins: `three@0.182.0` and `web-ifc@0.0.77` via root `overrides` (see docs/DECISIONS.md)
- [x] Project page: viewer, download IFC + other outputs, summary table from `summary.json`, assumptions from `assumptions.md`
- [x] `ModelSummary` type in `packages/shared` (contract for `ifc-tools validate`)
- [x] Tested in the browser with `tools/ifc-tools/tests/fixtures/simple-house.ifc` (generated by `make_simple_house.py`)
- [ ] Viewer performance check with a large (~50 MB) IFC
- [ ] Test on a real project page once Blob is configured (CORS from Blob URL, summary + assumptions rendering)

## Phase 6 — Local tools (`tools/ifc-tools`)
- [x] Add `httpx`, `ezdxf`, `pymupdf`, `ifcopenshell`, `jinja2`, `python-dotenv` (+ `pytest`, `ruff`)
- [x] `list` and `pull <id>` (admin API → `IFCWISE_DATA_DIR/jobs/<id>/`, `job.json`; token never sent to Blob)
- [x] `prepare`: DXF → `<name>.geometry.json` per layer, DWG → DXF via optional ODA converter, PDF → PNG pages, text inputs inlined, `PROMPT.md`
- [x] `validate`: rules from PLAN.md §8 → `output/summary.json` (`ModelSummary`), exit 1 on errors
- [x] Fixtures + pytest (12 tests: validate, prepare with generated DXF/PDF, pull with mocked API)
- [ ] `pull` against the real app once Blob + `ADMIN_API_TOKEN` are configured

## Phase 7 — Conversion toolkit
- [x] `docs/SOP-conversion.md` (review → pull → route choice → Route A / Route B → check → deliver → log)
- [x] `docs/revit-ifc-export.md`: "IFCWise IFC4 RV" exporter setup + troubleshooting
- [x] Route B builder: `ifc-tools build` turns `output/model-spec.json` into IFC4 (typed walls, slabs, flat roof,
      doors/windows in openings, spaces with floor areas); validates clean with no warnings; 8 more tests (20 total)
- [x] `PROMPT.md` explains both routes and the model-spec format
- [x] `docs/test-runs.md` log template
- [ ] Revit template `IFCWise_Template.rte` with IFC-mapped types (kept outside the public repo) _(user, in Revit)_
- [ ] Save the IFC export setup in Revit and export it to `C:\IFCWiseData\revit\` _(user, in Revit)_
- [ ] 3 test projects per input type on both routes; results in `docs/test-runs.md`
- [ ] Pitched roofs in the model spec (currently flat only)

## Phase 8 — Go live (follow docs/deploy.md)
- [x] Push to GitHub (barkx/AnythingIFC)
- [x] DNS: ifcwise.com nameservers → Vercel (ns1/ns2.vercel-dns.com, set 2026-10-27)
- [x] Deployment guide: `docs/deploy.md`
- [ ] Generate production secrets (SESSION_SECRET, ADMIN_API_TOKEN, EMAIL_ENCRYPTION_KEY, ADMIN_PASSWORD) _(user)_
- [ ] Vercel project `ifcwise-www` (root `apps/www`) + env vars _(user)_
- [ ] Vercel project `ifcwise-app` (root `apps/app`) + env vars _(user)_
- [ ] Blob store `ifcwise-projects` (public, Frankfurt) connected to `ifcwise-app`, redeploy _(user)_
- [ ] Domains: `ifcwise.com` + `www` redirect → ifcwise-www; `app.ifcwise.com` → ifcwise-app _(user)_
- [ ] Re-create MX/SPF records in Vercel DNS if @ifcwise.com email is used _(user)_
- [ ] `tools/ifc-tools/.env` pointing at production
- [ ] End-to-end test on production (docs/deploy.md §7)
- [ ] Fill legal entity details (`apps/www/src/lib/site.ts`); review privacy/terms
- [ ] Soft launch: 10 test projects, share gallery

## Design refresh (2026-10-27)
- [x] `packages/ui` design system shared by both apps (tokens, header, footer, buttons, pills)
- [x] Landing page: hero with live 3D model + input plan, stats, how it works, bento features, reference projects, use cases, FAQ, CTA
- [x] App: gallery with reference projects, reference project pages, embed route, restyled project/new/manage/admin pages
- [x] Viewer: floating controls, category colours, room volumes hidden, model shown before classification finishes
- [x] 4 reference projects (family house, row houses, small office, warehouse) via `npm run samples`
- [ ] Deploy both projects and check the redesign on production
- [ ] Replace the stock Open Graph image with one showing a reference model
