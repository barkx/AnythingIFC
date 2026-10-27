# IFCWise — Project Plan

_Version 2 · 2026-10-27 · local-first proof of concept (no Supabase)_

IFCWise turns CAD drawings, PDF plans, images/sketches and text descriptions into IFC building models.
Users upload on the web, files land directly in a folder on the owner's Windows PC, the job is converted
there (Codex + Revit MCP, or Blender + Bonsai), and the finished IFC is delivered back to the browser with a 3D viewer.

- **ifcwise.com** — landing page, hosted on Vercel
- **app.ifcwise.com** — web app, running on the owner's PC, published through a Cloudflare Tunnel

---

## 1. Goals and scope

### Proof of concept (this plan)

| Item | Decision |
|---|---|
| Users | Architects/designers, contractors/estimators, homeowners, facility managers |
| Inputs | DWG/DXF, PDF plans, images/sketches, text description (any combination in one job) |
| Output | IFC4, LOD 100–200: storeys, walls, slabs, roofs, doors, windows, spaces |
| Processing | Manual, human in the loop, 24–48 h turnaround |
| Conversion routes | A: Codex + Revit MCP (Revit 2025/2026) · B: Blender + Bonsai / IfcOpenShell |
| Access | Waitlist request → admin creates an **invite code** → user logs in with the code |
| Hosting of the app | On the owner's PC; public via Cloudflare Tunnel. PC must be on to accept uploads |
| Data | SQLite database + files in `C:\IFCWiseData` — nothing stored in the cloud |
| Pricing | Free, no limits for now |
| Retention | Inputs and outputs deleted automatically after 30 days |
| Admin alerts | Admin dashboard + Windows desktop notification + email (optional, via Resend) |
| Language | English only |

### Not in the PoC
Payments, automatic conversion without review, teams, public API, LOD 300+, MEP/structural detail, cloud database.

### Success criteria
1. 10 real test jobs (mixed input types) delivered end-to-end through the app.
2. Each delivered IFC opens in the web viewer, in BIMcollab Zoom / Solibri Anywhere, and re-imports into Revit.
3. Median manual processing time per job is measured (target: under 2 h for a single house).
4. At least 5 external testers complete a job and give feedback.

---

## 2. Architecture

```
 Browser ──▶ ifcwise.com            (Vercel, static Next.js landing page)
   │            └─ "Request access" form ──▶ POST app.ifcwise.com/api/waitlist
   │
   └──────▶ app.ifcwise.com         (Cloudflare edge, HTTPS)
                 │  Cloudflare Tunnel (cloudflared, outbound-only connection from the PC)
                 ▼
         Owner's Windows PC
         ├─ apps/app  (Next.js, `next start` on http://localhost:3001)
         │    ├─ invite-code login, uploads, jobs, viewer, admin
         │    ├─ SQLite  C:\IFCWiseData\ifcwise.db
         │    └─ files   C:\IFCWiseData\jobs\<job-id>\{input,prepared,output,...}
         ├─ tools/ifc-tools  (Python CLI, called by the app or by hand)
         │    ├─ prepare: DXF → JSON, PDF → PNG, PROMPT.md
         │    └─ validate: IfcOpenShell checks → summary.json
         └─ Operator: Codex + Revit MCP  or  Blender + Bonsai, working in the job folder
```

Key design choices:
- **Uploads go straight into the local folder** — no sync step, no cloud storage, no cloud database.
- **Cloudflare Tunnel** publishes the local app without opening ports on the router; Cloudflare provides HTTPS.
  This requires the ifcwise.com DNS zone to be on Cloudflare. The apex `ifcwise.com` then points to Vercel
  with DNS-only (grey cloud) records.
- **Swappable data layer.** Database access goes through Drizzle ORM and file access through a small
  `storage` module, so moving to Postgres + object storage later does not mean rewriting the app.
- **Human review gate.** Nothing is delivered until the admin clicks _Deliver_.
- **Limitation:** when the PC is off, app.ifcwise.com is down. The landing page stays up and its form
  falls back to an email link.

---

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Monorepo | npm workspaces | `apps/*`, `packages/*` |
| Web apps | Next.js (App Router) + TypeScript + Tailwind CSS | `apps/www` (port 3000), `apps/app` (port 3001) |
| Shared code | `packages/shared` | job status enum, limits, allowed file types |
| Database | SQLite via `better-sqlite3` + Drizzle ORM | file `C:\IFCWiseData\ifcwise.db`, WAL mode |
| Sessions | Signed httpOnly cookie + `sessions` table | invite-code login, no passwords |
| IFC viewer | That Open Engine (`@thatopen/components`, `web-ifc`) | runs fully in the browser |
| Python tools | Python 3.12 via `uv`; `typer`, `ifcopenshell`, `ezdxf`, `pymupdf` | `tools/ifc-tools` |
| Publishing | Cloudflare Tunnel (`cloudflared` as Windows service) | app.ifcwise.com |
| Landing hosting | Vercel (Pro for commercial use) | ifcwise.com |
| Email (optional) | Resend | admin/user notifications |
| Process manager | NSSM or a scheduled task | keeps `next start` and `cloudflared` running |

---

## 4. Repository structure

```
C:\IFCWise\                    (git repo → GitHub private repo "ifcwise")
├─ apps/
│  ├─ www/                     ifcwise.com – landing, privacy, terms
│  └─ app/                     app.ifcwise.com
│     └─ src/
│        ├─ app/
│        │  ├─ login/          invite code entry
│        │  ├─ jobs/           list, new, [id]
│        │  ├─ admin/          invites, waitlist, jobs queue, job detail
│        │  └─ api/            waitlist, uploads, downloads, health
│        ├─ db/                Drizzle schema, migrations, client
│        └─ lib/               auth, storage, jobs state machine, notifications
├─ packages/
│  └─ shared/                  types, constants (job statuses, limits, file types)
├─ tools/
│  └─ ifc-tools/               Python CLI (prepare, validate)
├─ docs/
│  ├─ DECISIONS.md             architecture decision log
│  ├─ SOP-conversion.md        manual conversion procedure
│  ├─ revit-ifc-export.md      Revit export settings
│  └─ deploy-local.md          running the app + tunnel on the PC
├─ .claude/                    Claude Code settings, launch config, commands
├─ AGENTS.md                   instructions for all coding agents (Codex, Claude, …)
├─ CLAUDE.md                   Claude Code entry point (imports AGENTS.md)
├─ TASKS.md                    the task list — source of truth for progress
├─ PLAN.md                     this file
└─ README.md
```

Customer data never lives in the repo. Location is set by `IFCWISE_DATA_DIR` (default `C:\IFCWiseData`).

---

## 5. Data model (SQLite via Drizzle)

```
invites     (code PK, label, email null, max_uses default 1, uses, role 'user'|'admin',
             created_at, expires_at null, revoked_at null)
users       (id, name, email, company, user_type, role 'user'|'admin',
             invite_code → invites, created_at, last_login_at, blocked_at null)
sessions    (id PK random 32 bytes, user_id → users, created_at, expires_at)
waitlist    (id, name, email, company, user_type, intended_use, created_at, invited_at null)
jobs        (id, user_id → users, title, description, building_type, storeys,
             approx_area_m2, units default 'm', ifc_schema default 'IFC4',
             status, route 'revit'|'bonsai' null, admin_notes, user_message,
             created_at, started_at, delivered_at, expires_at)
job_files   (id, job_id → jobs, kind 'input'|'output'|'preview'|'summary'|'assumptions',
             rel_path, filename, mime, size_bytes, sha256, created_at)
job_events  (id, job_id, from_status, to_status, actor_user_id, note, created_at)
```

- `user_type`: architect | contractor | homeowner | facility_manager | other
- Admin account is bootstrapped from `ADMIN_INVITE_CODE` in `.env` on first start.
- Session cookie: `ifcwise_session`, httpOnly, Secure (in production), SameSite=Lax, 30 days.

**Files**
- Path on disk: `<IFCWISE_DATA_DIR>/jobs/<job-id>/<input|output|...>/<safe-filename>`.
- Uploads are streamed to disk by a route handler (no full buffering in memory).
- Downloads are served by a route handler that checks the session owns the job.
- Limits: 100 MB per file (Cloudflare's free-plan request limit), max 20 files per job.
- Allowed: `.dwg .dxf .pdf .png .jpg .jpeg .webp .heic .txt .md`.

---

## 6. Job lifecycle

```
submitted ──admin "Start"──▶ processing ──admin "Submit for review"──▶ review
                                  │          (runs ifc-tools validate)    │
                                  ▼                                admin "Deliver"
                              needs_info ◀──────── admin ──────────────┤    ▼
                       (user replies/adds files)                       │ completed
                                  └──▶ submitted                       ▼
any state ──user──▶ cancelled                                        failed
completed / failed / cancelled ──30 days──▶ expired (files deleted)
```

| Transition | Who | Side effects |
|---|---|---|
| → submitted | User | Files saved, `ifc-tools prepare` runs, admin notified |
| → processing | Admin | Job folder opened in Explorer |
| → review | Admin | `ifc-tools validate` on `output/*.ifc`, summary stored |
| → completed | Admin | User notified (email if configured) |
| → needs_info | Admin | User sees question on job page |
| → failed | Admin | User sees reason |
| → expired | Daily cleanup | Job folder deleted, record kept without files |

---

## 7. Features

### ifcwise.com (`apps/www`)
- Hero "From drawings to IFC", how it works (Upload → We model → Download IFC), supported inputs, LOD explanation.
- Use cases for the four user groups, FAQ, privacy policy, terms, imprint.
- **Request access** form → `POST https://app.ifcwise.com/api/waitlist`; if the app is offline,
  show a fallback `mailto:` link. No cookies, no tracking.

### app.ifcwise.com (`apps/app`)
- **Login**: invite code (+ name, email, company, user type on first use).
- **New job**: title, description, building type, storeys, approx. area, units; drag-and-drop
  files with progress; checkbox "I have the right to share these files".
- **Jobs**: list with status badges; detail with timeline, admin messages, reply/add files when
  `needs_info`, IFC viewer, element summary, `assumptions.md`, download IFC.
- **Admin**: waitlist → create invite; invites list (copy/revoke); jobs queue with age;
  job detail with Start / Open folder / Submit for review / Deliver / Needs info / Fail, notes.
- **Notifications**: Windows toast on the PC for new jobs; optional emails through Resend.

---

## 8. Python tools (`tools/ifc-tools`)

```
ifc-tools prepare <job-dir>      # DXF → prepared/dxf_geometry.json, PDF → prepared/pages/*.png, PROMPT.md
ifc-tools validate <job-dir>     # checks output/model.ifc, writes output/summary.json, exit code 1 on errors
ifc-tools cleanup <data-dir>     # removes folders of expired jobs (also done by the app)
```

Job folder:
```
C:\IFCWiseData\jobs\<job-id>\
├─ job.json        metadata written by the app
├─ input\          original uploads (read-only)
├─ prepared\       extracted data
├─ PROMPT.md       instructions for Codex (see §9)
├─ revit\  bonsai\ working files
└─ output\         model.ifc, summary.json, assumptions.md, preview.png
```

**Validation rules**: file parses; schema as requested; one `IfcProject`, one `IfcSite`,
≥1 `IfcBuilding`, ≥1 `IfcBuildingStorey`; metre units (or job units); ≥1 `IfcWall`; every element
contained in a storey. Warnings: no `IfcSpace`, no openings, untyped elements.
`summary.json`: element counts per class per storey, bounding box, floor area.

DWG files: converted to DXF with ODA File Converter if installed; otherwise used only as Revit underlay.

---

## 9. Conversion procedure (manual PoC)

Full procedure in `docs/SOP-conversion.md`.

### Route A — Codex + Revit MCP
1. Admin clicks **Start** → job folder opens; read inputs and PROMPT.md.
2. Open `IFCWise_Template.rte` (metric, levels, basic types with IFC mappings).
3. Underlay inputs: DWG via Link CAD, PDF via Link PDF, images via Import Image; scale and align.
4. Run Codex in the job folder with PROMPT.md; it uses the Revit MCP to create levels, walls,
   floors, roof, doors, windows, rooms, using `prepared/dxf_geometry.json` where available.
5. Fix by hand: joins, heights, openings, room boundaries.
6. Export IFC4 Reference View (rooms as IfcSpace, base quantities) → `output/model.ifc`.
7. Write `output/assumptions.md`; click **Submit for review**.

### Route B — Blender + Bonsai
Codex (or Claude Code) writes IfcOpenShell/Bonsai scripts that create the IFC directly.
Used side by side with Route A on the first 10 test jobs to compare time and quality.

### PROMPT.md template (abridged)
```
You are modelling a building as IFC at LOD 100–200.
Job: {{title}} — {{building_type}}, {{storeys}} storeys, ~{{area}} m², units {{units}}.
Client description: {{description}}
Inputs: {{file list}}   Prepared data: prepared/dxf_geometry.json, prepared/pages/*.png
Rules: storey height 3.0 m, exterior walls 300 mm, interior 120 mm, slabs 200 mm unless given;
one level per storey; doors 900×2100, windows 1200×1200 sill 900 unless shown;
spaces named from drawing text; do not invent unsupported elements;
list every assumption in output/assumptions.md.
```

---

## 10. Licensing and terms of service

| Topic | PoC position | Before automating |
|---|---|---|
| Revit | Commercial license used by a person to produce client deliverables — standard use | Unattended SaaS use is a grey area → review Autodesk terms or use APS Design Automation |
| Codex on ChatGPT Plus/Pro | OK while you run it interactively | Unattended customer jobs → OpenAI API (or Claude API) |
| Blender / Bonsai / IfcOpenShell | Open source; outputs unrestricted | Same |
| ODA File Converter | Free; check terms for commercial use | ODA membership or Revit-only DWG path |
| Cloudflare Tunnel (free) | Fine for a web app; 100 MB upload limit per request | Same |
| User uploads | Users confirm rights; terms grant a limited licence to process | Same |
| GDPR | Data stays on your PC in Slovenia, 30-day retention, privacy policy | Same |

Customer files are never used to train AI models; state this in the privacy policy.

---

## 11. Security

- The PC is exposed only through the tunnel; no router ports opened; `cloudflared` only forwards to `localhost:3001`.
- Optional extra layer for the admin area: Cloudflare Access on `/admin*`.
- All pages and files require a valid session; users only see their own jobs (checked on every query).
- Filenames sanitised; paths built only from job IDs; uploads never executed; size and type checked server-side.
- Invite codes: 12+ random characters, single-use by default, revocable; rate limit on login attempts.
- Rate limit job creation (5/day/user) and the waitlist endpoint.
- `IFCWISE_DATA_DIR` backed up nightly (e.g. to an external drive) while jobs are active.

---

## 12. Environment variables

| Name | Where | Purpose |
|---|---|---|
| `IFCWISE_DATA_DIR` | app | data folder, default `C:\IFCWiseData` |
| `SESSION_SECRET` | app | signs session cookies (32+ random bytes) |
| `ADMIN_INVITE_CODE` | app | bootstraps the admin account |
| `APP_URL` | app, www | `http://localhost:3001` in dev, `https://app.ifcwise.com` in prod |
| `WWW_URL` | app | for CORS on `/api/waitlist` |
| `IFC_TOOLS_CMD` | app | command to run the Python tools, default `uv run --project ../../tools/ifc-tools ifc-tools` |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` | app | optional email |
| `NEXT_PUBLIC_APP_URL` | www | link target for login / waitlist form |

---

## 13. Build order

Detailed, checkable tasks live in [TASKS.md](TASKS.md). Summary:

| Phase | Outcome |
|---|---|
| 0 — Foundations | Monorepo, agent docs, both apps and Python tools run locally, first commit |
| 1 — Landing page | ifcwise.com content complete (local), privacy/terms |
| 2 — Auth & invites | Invite-code login, sessions, admin bootstrap, waitlist + invite management |
| 3 — Jobs & uploads | New job form, streamed uploads to `C:\IFCWiseData`, job list/detail, admin queue |
| 4 — Python tools | `prepare` and `validate` working, called from the app |
| 5 — Delivery & viewer | Admin actions, IFC viewer, downloads, needs-info flow, notifications |
| 6 — Conversion toolkit | Revit template, export settings, SOP, Bonsai starter, 3 tests per input type |
| 7 — Retention & polish | Daily cleanup, error pages, mobile check, backups |
| 8 — Go live | GitHub push, Vercel + DNS on Cloudflare, tunnel + services on the PC, soft launch |

Rough total: 8–12 working days, plus conversion practice time.

---

## 14. After the PoC

- **Stage 2 — semi-automated:** the agent runs on new jobs by itself (OpenAI/Claude API), operator reviews;
  Bonsai route runs headless; Revit headless via APS Design Automation.
- **Move to the cloud when needed:** swap SQLite → Postgres and local files → object storage
  (Drizzle + `storage` module make this a contained change); the PC becomes a worker that pulls jobs.
- **Stage 3 — product:** Stripe pricing, teams, API, BCF comments in the viewer, RVT/DWG/quantity outputs, higher LOD.

---

## 15. Risks and open questions

| Risk | Mitigation |
|---|---|
| PC off → app down | Clear status message on landing page; turnaround promise 24–48 h; services auto-start |
| PC disk failure → data loss | Nightly backup of `C:\IFCWiseData` |
| Manual time per job too high | Measure in Phase 6; choose the faster route per input type |
| Poor results from sketches/text | Structured form fields, needs-info flow, assumptions.md |
| Uploads > 100 MB | Ask for split/compressed files; chunked uploads later |
| Licensing when automating | §10; decide before Stage 2 |

Open questions:
1. Brand look (logo, colours).
2. Legal entity for terms and imprint (name, address, VAT ID).
3. Deliver native files (RVT / .blend) as well as IFC?
4. IFC4 only, or also IFC2x3?
