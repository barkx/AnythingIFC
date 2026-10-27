# TASKS

Source of truth for progress. Agents: take the first unchecked task in the current phase,
tick it when done (`- [x]`), and add a short note after it if useful. Details for each phase are in [PLAN.md](PLAN.md).

**Current phase: 1 — Landing page**

---

## Phase 0 — Foundations
- [x] PLAN.md (v2, local-first, no Supabase)
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
- [ ] Create private GitHub repo `ifcwise` and push _(end of session, user decides)_

## Phase 1 — Landing page (`apps/www`)
- [ ] Brand basics: wordmark, colour tokens, typography (light + dark)
- [ ] Hero: "From drawings to IFC" + primary CTA
- [ ] How it works (Upload → We model → Download IFC)
- [ ] Supported inputs + what LOD 100–200 contains
- [ ] Use cases: architects, contractors, homeowners, facility managers
- [ ] FAQ (what is IFC, turnaround, privacy, retention)
- [ ] Request-access form → `POST {NEXT_PUBLIC_APP_URL}/api/waitlist`, with `mailto:` fallback when offline
- [ ] Privacy policy, terms, imprint pages (placeholders for legal entity)
- [ ] SEO: metadata, Open Graph image, favicon, sitemap, robots
- [ ] Mobile check at 375 px

## Phase 2 — Auth and invites (`apps/app`)
- [ ] Data dir bootstrap: create `IFCWISE_DATA_DIR`, `jobs/`, SQLite file with WAL
- [ ] Drizzle setup + schema: `invites`, `users`, `sessions`, `waitlist` + first migration
- [ ] Session helpers: create/read/destroy, signed httpOnly cookie
- [ ] Admin bootstrap from `ADMIN_INVITE_CODE`
- [ ] Login page: invite code → first-time profile form → session
- [ ] Route protection (middleware + server checks), logout
- [ ] `POST /api/waitlist` with CORS for `WWW_URL`, zod validation, rate limit
- [ ] Admin: waitlist list → "Create invite" (copies code + message to clipboard)
- [ ] Admin: invites list, revoke
- [ ] Login rate limiting

## Phase 3 — Jobs and uploads
- [ ] Schema: `jobs`, `job_files`, `job_events` + migration
- [ ] `lib/storage.ts`: job folders, safe filenames, streamed writes, sha256
- [ ] Upload route handler (streamed, size/type checks, 100 MB/file, 20 files/job)
- [ ] New job form with drag-and-drop and per-file progress
- [ ] Write `job.json` on submit
- [ ] Jobs list + job detail with status timeline
- [ ] Admin jobs queue (filter by status, age)
- [ ] Windows toast notification on new job (+ optional Resend email)
- [ ] Rate limit: 5 jobs/day/user

## Phase 4 — Python tools
- [ ] Add `ezdxf`, `pymupdf`, `ifcopenshell`, `jinja2` to `tools/ifc-tools`
- [ ] `prepare`: DXF → `prepared/dxf_geometry.json` (layers, polylines, texts, units)
- [ ] `prepare`: PDF → `prepared/pages/*.png`
- [ ] `prepare`: render `PROMPT.md` from template + `job.json`
- [ ] `validate`: rules from PLAN.md §8, `output/summary.json`, exit codes
- [ ] Sample files in `tools/ifc-tools/tests/fixtures` + pytest tests
- [ ] App runs `prepare` after submit and `validate` on "Submit for review" (`IFC_TOOLS_CMD`)

## Phase 5 — Delivery and viewer
- [ ] Admin job detail: Start / Open folder / Submit for review / Deliver / Needs info / Fail + notes
- [ ] State machine in `lib/jobs.ts` with `job_events` logging
- [ ] Download route (session + ownership check)
- [ ] IFC viewer (That Open Engine): load model, orbit, storey filter
- [ ] Job page: summary.json table, assumptions.md, download button
- [ ] Needs-info flow: user reply + extra files → back to `submitted`
- [ ] User notifications (in-app status; email if Resend configured)

## Phase 6 — Conversion toolkit
- [ ] `docs/SOP-conversion.md` (Route A + B, step by step)
- [ ] `docs/revit-ifc-export.md` + saved IFC export setup
- [ ] `IFCWise_Template.rte` with IFC-mapped types (stored outside git or via LFS — decide)
- [ ] Bonsai/IfcOpenShell starter script (storeys, walls, slabs, openings, spaces)
- [ ] 3 internal test jobs per input type on both routes; record time + issues in `docs/test-runs.md`
- [ ] Decide route per input type

## Phase 7 — Retention and polish
- [ ] Daily cleanup: expire jobs after 30 days, delete folders, keep records
- [ ] Error pages, empty states, loading states
- [ ] Mobile check of all app pages
- [ ] Nightly backup script for `IFCWISE_DATA_DIR`

## Phase 8 — Go live
- [ ] Push to private GitHub repo
- [ ] Move ifcwise.com DNS to Cloudflare; Vercel project for `apps/www`; apex + www records (DNS only)
- [ ] `cloudflared` tunnel `app.ifcwise.com → http://localhost:3001` as Windows service
- [ ] `next start` for `apps/app` as Windows service (NSSM); `docs/deploy-local.md`
- [ ] Production `.env.local` (secrets, `APP_URL`, `WWW_URL`)
- [ ] Optional: Cloudflare Access on `/admin*`
- [ ] Soft launch: invite 10–20 testers; feedback form on completed jobs
