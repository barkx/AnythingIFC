# IFCWise — Project Plan

_Version 3 · 2026-10-27 · public projects on Vercel, local computation_

IFCWise turns CAD drawings, PDF plans, images/sketches and text descriptions into IFC building models.
Anyone can start a project on the web. Projects are public: once approved, each one is visible to every visitor.
The owner downloads new projects to a Windows PC, models them there (Codex + Revit MCP, or Blender + Bonsai),
and uploads the finished IFC through an admin page. Visitors view it in the browser and download it.

- **ifcwise.com** — landing page (`apps/www`, Vercel)
- **app.ifcwise.com** — public projects + admin (`apps/app`, Vercel)
- **Owner's PC** — computation only; never hosts anything

---

## 1. Goals and scope

| Item | Decision |
|---|---|
| Users | Architects/designers, contractors/estimators, homeowners, facility managers |
| Inputs | DWG/DXF, PDF plans, images/sketches, text description (any combination per project) |
| Output | IFC4, LOD 100–200: storeys, walls, slabs, roofs, doors, windows, spaces |
| Visibility | **All projects public.** Visible in the gallery after admin approval; before that only via the project's own link |
| Identity | No accounts. Creator gives a display name (public) and email (encrypted, admin-only) |
| Ownership | Creator gets a private **manage link** to edit or delete the project |
| Admin | One admin, password login; approves, posts results, asks questions, deletes |
| Processing | Manual on the owner's PC, human in the loop, 24–48 h target |
| Storage | **Vercel Blob only** — files + one `project.json` per project; no database |
| Retention | Kept until the creator or admin deletes the project |
| Pricing | Free |
| Language | English |

### Not in the PoC
Payments, user accounts, private projects, automatic conversion without review, LOD 300+, MEP/structural.

### Success criteria
1. 10 real projects (mixed input types) delivered end-to-end and shown in the gallery.
2. Each IFC opens in the web viewer, BIMcollab Zoom / Solibri Anywhere, and re-imports into Revit.
3. Median manual processing time measured (target under 2 h for a single house).
4. At least 5 external people create a project.

---

## 2. Architecture

```
 Visitor ─▶ ifcwise.com  (Vercel, apps/www)  ── "Start a project" / "Browse projects" ─┐
                                                                                         ▼
 Visitor ─▶ app.ifcwise.com (Vercel, apps/app)
              ├─ /                 public gallery (approved projects)
              ├─ /new              create project → files upload straight to Vercel Blob
              ├─ /p/[id]           project page: status, inputs, 3D IFC viewer, downloads
              ├─ /p/[id]/manage?t= creator: edit, reply to questions, delete
              ├─ /admin            password login; queue, approve, upload IFC, notes, delete
              └─ /api/admin/*      bearer-token API for the local CLI
                         │
                   Vercel Blob  projects/<id>/project.json · input/* · output/*
                         ▲
 Owner's PC ──(HTTPS, admin token)── ifc-tools pull <id>  → C:\IFCWiseData\jobs\<id>\
              Codex + Revit MCP  or  Blender + Bonsai  → output/model.ifc
              ifc-tools validate <id> → summary.json
              Admin page: upload model.ifc + summary.json + assumptions.md → "Complete"
```

Key choices:
- **No hosting on the PC.** The PC only makes outbound requests; it can be off any time.
- **Browser uploads go directly to Blob** (`@vercel/blob/client`), so Vercel's 4.5 MB function body limit
  doesn't apply. The server only issues upload tokens after checking type, size and path.
- **No database.** `project.json` per project is the record. The gallery lists `projects/*/project.json`
  and is cached; every write invalidates the cache. Good for hundreds of projects; move to Postgres later if needed.
- **Approval gate.** Unapproved projects never appear in the gallery, sitemap or search engines.

---

## 3. Tech stack

| Layer | Choice |
|---|---|
| Monorepo | npm workspaces: `apps/www`, `apps/app`, `packages/shared`, `tools/ifc-tools` |
| Web | Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS 4 |
| Storage | Vercel Blob (`@vercel/blob`), public access, random suffixes on file names |
| Validation | `zod` on every route handler / server action |
| Secrets | email encryption (AES-256-GCM), admin session + API token from env |
| IFC viewer | That Open Engine (`@thatopen/components`, `web-ifc`) in the browser |
| Email (optional) | Resend: admin on new project; creator when the IFC is ready or a question is asked |
| Spam protection | approval gate, honeypot field, per-IP limit, optional Cloudflare Turnstile |
| Local tools | Python 3.12 via `uv`: `typer`, `httpx`, `ifcopenshell`, `ezdxf`, `pymupdf`, `jinja2` |
| Hosting | Vercel (Hobby during PoC — non-commercial only; Pro before any paid use) |

---

## 4. Repository structure

```
apps/www/                      landing, privacy, terms, imprint
apps/app/src/
  app/
    page.tsx                   gallery
    new/                       create project
    p/[id]/                    project page, manage/
    admin/                     login, queue, project detail
    api/upload/                Blob client-upload token handler
    api/admin/projects/        list + detail for the local CLI (bearer token)
  lib/
    projects.ts                read/write project.json, gallery listing, cache tags
    blob.ts                    path helpers, upload rules
    crypto.ts                  email encryption, manage-token hashing
    admin-auth.ts              admin session cookie + API token check
packages/shared/               statuses, limits, file types, Project type
tools/ifc-tools/               pull, prepare, validate
docs/                          DECISIONS, SOP-conversion, revit-ifc-export
```

Customer files on the PC live in `C:\IFCWiseData` (outside the repo).

---

## 5. Data model — `projects/<id>/project.json`

```ts
type Project = {
  id: string;                    // 10-char random, URL-safe
  createdAt: string; updatedAt: string;
  title: string; description: string;
  buildingType?: string; storeys?: number; approxAreaM2?: number; units: "m" | "ft";
  author: { displayName: string };
  contact: { emailEnc: string }; // AES-256-GCM, never sent to the browser
  manageTokenHash: string;       // sha256 of the secret in the manage link
  status: "submitted" | "in_progress" | "needs_info" | "completed" | "rejected";
  published: boolean;            // true once admin approves → appears in gallery
  adminMessage?: string;         // public note / question from admin
  inputs:  BlobFile[];           // { pathname, url, filename, size, contentType }
  outputs: BlobFile[];           // model.ifc, summary.json, assumptions.md, preview.png
  events: { at: string; status: Project["status"]; note?: string }[];
};
```

Blob paths: `projects/<id>/project.json`, `projects/<id>/input/<name>`, `projects/<id>/output/<name>`.
A public API serialiser strips `contact` and `manageTokenHash` before anything reaches the browser.

Limits: 100 MB per file, 20 files per project, 3 new projects per IP per day.
Allowed inputs: `.dwg .dxf .pdf .png .jpg .jpeg .webp .heic .txt .md`. Outputs: `.ifc .json .md .png`.

---

## 6. Project lifecycle

```
submitted ──admin approve──▶ (published) ──admin start──▶ in_progress ──admin upload IFC──▶ completed
    │                                                         │
    └──admin reject──▶ rejected               admin asks ──▶ needs_info ──creator replies──▶ in_progress
creator or admin ──delete──▶ all blobs under projects/<id>/ removed
```

Approval (published) and progress (status) are separate: you can start work before publishing.

---

## 7. Features

### ifcwise.com
Hero, how it works, inputs/output, use cases, FAQ ("projects are public"), CTA **Start a project** and
**Browse projects**, privacy/terms/imprint.

### app.ifcwise.com
- **Gallery**: cards with title, author, building type, status, thumbnail; filter by status.
- **New project**: title, description, building type, storeys, area, units, display name, email,
  files (drag-and-drop, progress), checkboxes: "I have the right to share these files" and
  "I understand this project and its files will be public". After submit: project link + manage link
  (shown once, also emailed if Resend is configured).
- **Project page**: description, inputs (download/preview), status timeline, admin message,
  3D viewer + element summary + assumptions, download IFC.
- **Manage page** (secret link): edit text, add files, answer a question, delete project.
- **Admin**: password login; queue (unapproved first, then by age); approve/unpublish, set status,
  write message, upload outputs, delete; see decrypted email; "copy pull command".

---

## 8. Local tools (`tools/ifc-tools`)

```
ifc-tools pull <id>          # GET /api/admin/projects/<id> with ADMIN_API_TOKEN, download inputs,
                             # write job.json, then run prepare
ifc-tools prepare <job-dir>  # DXF → prepared/dxf_geometry.json, PDF → prepared/pages/*.png, PROMPT.md
ifc-tools validate <job-dir> # check output/model.ifc → output/summary.json, exit 1 on errors
ifc-tools list               # projects waiting for work
```

Job folder: `C:\IFCWiseData\jobs\<id>\{job.json, input\, prepared\, PROMPT.md, revit\, bonsai\, output\}`.
Upload of results stays manual through the admin page for now (keeps the Blob token off the PC).

Validation rules: parses; schema IFC4; one `IfcProject`, `IfcSite`, ≥1 `IfcBuilding`, ≥1 `IfcBuildingStorey`;
metre units; ≥1 `IfcWall`; every element contained in a storey. Warnings: no `IfcSpace`, no openings.

---

## 9. Conversion procedure (manual PoC)

Route A — Codex + Revit MCP: `ifc-tools pull`, open template, underlay DWG/PDF/images, run Codex with
PROMPT.md, fix by hand, export IFC4 Reference View, write `assumptions.md`, `ifc-tools validate`, upload.

Route B — Blender + Bonsai: Codex/Claude writes IfcOpenShell scripts that create the IFC directly.
Both routes compared on the first test projects. Full steps in `docs/SOP-conversion.md`.

---

## 10. Licensing, privacy and public content

| Topic | Position |
|---|---|
| Revit | Commercial licence used by a person to make deliverables — standard use. Automation → APS Design Automation |
| Codex on ChatGPT Plus/Pro | Interactive use only; unattended jobs → OpenAI API |
| Public uploads | Creators confirm rights **and** consent to public display; terms grant IFCWise a licence to display inputs and models |
| Personal data | Only display name is public; email encrypted, used only for notifications; warn against uploading personal data (names/addresses on drawings) |
| Takedown | Report link on every project page → admin deletes |
| Vercel Hobby | Non-commercial only; switch to Pro before charging |
| AI training | Files are never used to train AI models |

---

## 11. Security

- Admin: `ADMIN_PASSWORD` → signed httpOnly session cookie; `ADMIN_API_TOKEN` for the CLI; both only in env.
- Manage links: 32-byte random token; only its SHA-256 is stored.
- Upload tokens issued only for `projects/<id>/input/` of a project created in the last hour or via a valid
  manage/admin session; content type and size enforced by Blob token.
- Never render uploaded HTML/SVG inline; serve downloads with `Content-Disposition: attachment`.
- `noindex` on unpublished projects and manage/admin pages.
- Rate limits per IP on project creation; honeypot; optional Turnstile.

---

## 12. Environment variables (`apps/app`)

| Name | Purpose |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (added automatically when the store is connected) |
| `ADMIN_PASSWORD` | admin login |
| `SESSION_SECRET` | signs admin session cookie |
| `ADMIN_API_TOKEN` | bearer token for `ifc-tools` |
| `EMAIL_ENCRYPTION_KEY` | 32-byte base64 key for AES-256-GCM |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` | canonical URLs |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` | optional email |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | optional spam protection |

Local tools: `IFCWISE_APP_URL`, `IFCWISE_ADMIN_TOKEN`, `IFCWISE_DATA_DIR`.

---

## 13. Build order

Details in [TASKS.md](TASKS.md).

| Phase | Outcome |
|---|---|
| 0 — Foundations | Monorepo, agent docs, both apps run, first commit ✅ |
| 1 — Landing page | ifcwise.com content, legal drafts, SEO ✅ (CTAs updated for public projects) |
| 2 — Projects on Blob | `project.json` store, create flow with direct uploads, project page, manage link |
| 3 — Gallery | Cached public gallery, filters, thumbnails, sitemap of published projects |
| 4 — Admin | Login, queue, approve, status/messages, upload outputs, delete, admin API |
| 5 — Viewer | That Open viewer, summary table, assumptions, downloads |
| 6 — Local tools | `pull`, `prepare`, `validate`, `list` |
| 7 — Conversion toolkit | Revit template, export settings, SOP, Bonsai starter, test projects |
| 8 — Go live | Push to GitHub, two Vercel projects, Blob store, DNS on Vercel, env vars, soft launch |

---

## 14. After the PoC

- Semi-automation: agent runs on new projects via OpenAI/Claude API; Bonsai route headless; Revit via APS.
- `ifc-tools push` to upload results directly once a scoped upload flow exists.
- Accounts and private projects (paid), Postgres when the gallery outgrows Blob listing, BCF comments,
  quantity take-off exports, higher LOD.

---

## 15. Risks and open questions

| Risk | Mitigation |
|---|---|
| Spam / abusive uploads | Approval gate, rate limits, honeypot, Turnstile, report link |
| Confidential drawings uploaded publicly | Clear warning + mandatory consent checkbox; fast takedown |
| Blob costs/limits on Hobby | Monitor usage; 100 MB/file; move to Pro if needed |
| Concurrent edits to `project.json` | Single admin writer; creator edits rare; last write wins is acceptable for PoC |
| Manual time per project too high | Measure; choose faster route per input type |

Open: brand assets, legal entity details, IFC2x3 option, whether to show input files publicly or only the model.
