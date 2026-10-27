# AGENTS.md — instructions for coding agents

This file is read by every coding agent working on this repo (Codex, Claude Code, Cursor, …).
`CLAUDE.md` imports it. Keep it short and current — update it when a convention changes.

## What this project is

IFCWise turns CAD drawings, PDF plans, images and text into IFC building models.
Proof of concept: anyone creates a **public project** on **app.ifcwise.com** (Vercel); files go to Vercel Blob.
The owner pulls projects to a Windows PC, models them by hand (Codex + Revit MCP or Blender + Bonsai) and
uploads the IFC through the admin page. Visitors view it in the browser. **ifcwise.com** is the landing page.
The PC never hosts anything.

Read before larger changes:
- [PLAN.md](PLAN.md) — architecture, data model, job lifecycle, build order
- [TASKS.md](TASKS.md) — what to do next; the source of truth for progress
- [docs/DECISIONS.md](docs/DECISIONS.md) — why things are the way they are

## Layout

| Path | What | Port |
|---|---|---|
| `apps/www` | Landing page (Next.js, deployed to Vercel) | 3000 |
| `apps/app` | Public projects + admin (Next.js, deployed to Vercel) | 3001 |
| `packages/shared` | Shared TypeScript constants and types (`@ifcwise/shared`) | — |
| `tools/ifc-tools` | Python CLI run on the owner's PC: `pull`, `prepare`, `validate` (uv project) | — |
| `docs/` | Decisions, SOPs, deployment notes | — |

Project data lives in **Vercel Blob** (`projects/<id>/project.json`, `input/`, `output/`). Local working
copies live outside the repo in `IFCWISE_DATA_DIR` (default `C:\IFCWiseData`). Never write project files inside the repo.

## Commands

Run from the repo root (Windows; PowerShell or Git Bash both work).

```bash
npm install                       # install all workspaces
npm run dev                       # www on :3000 and app on :3001
npm run dev:www                   # landing only
npm run dev:app                   # app only
npm run build                     # build all workspaces
npm run lint                      # lint all workspaces
npm run typecheck                 # tsc --noEmit in all workspaces
npm run tools -- --help             # ifc-tools: list, pull, prepare, validate
npm run test:tools                  # pytest for tools/ifc-tools
```

Before saying a task is done: `npm run typecheck`, `npm run lint` and `npm run build` must pass
(plus `npm run test:tools` and `ruff check` for Python changes), and UI changes must be checked in a browser.

## Stack and conventions

- **Next.js 16** — newer than most agents' training data. Each app has its own `AGENTS.md` (written by
  Next.js) that says to read the bundled docs in `apps/<app>/node_modules/next/dist/docs/` (or the hoisted
  `node_modules/next/dist/docs/` at the repo root) before using an API. Do that. Cache Components are on.
- **TypeScript strict**, Next.js App Router, React Server Components by default; `"use client"` only where needed.
- **Tailwind CSS** for styling. No other CSS frameworks or UI kits without a decision in `docs/DECISIONS.md`.
- **npm workspaces** (not pnpm/yarn). Add deps to the workspace that uses them: `npm i <pkg> -w apps/app`.
- **No database.** Each project is one `project.json` in Vercel Blob. All reads/writes go through
  `apps/app/src/lib/projects.ts`; Blob paths come only from `apps/app/src/lib/blob.ts` (project IDs +
  sanitised filenames, never raw user input). Browser uploads use `@vercel/blob/client` (direct to Blob).
- **Public by default, private fields never leak:** `contact.emailEnc` and `manageTokenHash` are stripped
  by the public serialiser in `projects.ts` before any data reaches a client component or API response.
- **Shared constants** (job statuses, allowed file types, limits) live in `packages/shared` and are
  imported, never duplicated.
- **Python:** 3.12 via `uv`, `typer` CLI, type hints, `ruff` formatting. Heavy deps (`ifcopenshell`,
  `ezdxf`, `pymupdf`) are added in the phase that needs them.
- Names: files `kebab-case.ts`, React components `PascalCase`, DB columns `snake_case`.
- Server-side input validation with `zod` on every route handler and server action.
- Keep comments sparse; explain *why*, not *what*.

## Rules

1. **Work from TASKS.md.** Pick the first unchecked task of the current phase unless told otherwise.
   When done, tick it (`- [x]`) and add a one-line note if something notable happened.
2. **Small steps.** One task per change; don't refactor unrelated code.
3. **Record decisions.** Anything that changes the architecture, stack or a convention → add an entry
   to `docs/DECISIONS.md` and update PLAN.md / this file if affected.
4. **No secrets in git.** Use `.env.local` (gitignored); keep `.env.example` files up to date with names only.
5. **Only Vercel services** (Vercel Blob, optionally Resend and Turnstile) in the PoC; no Supabase/DB
   unless a decision says otherwise.
6. **Security basics:** admin pages and `/api/admin/*` check the admin session or bearer token on the server;
   manage pages check the manage token hash; unpublished projects are `noindex` and excluded from listings.
7. **Terms of service:** don't build anything that runs ChatGPT/Codex or Revit unattended on customer jobs.
   The PoC keeps a human in the loop (see PLAN.md §10).
8. Don't commit or push unless the user asks. Commit messages: imperative, short subject, e.g.
   `app: add project create flow`.

## Conversion work (not app code)

Codex sessions that model buildings run inside a **job folder** in `C:\IFCWiseData\jobs\<id>\` (created by `ifc-tools pull`), guided by that
folder's `PROMPT.md` — not inside this repo. The template for `PROMPT.md` lives in
`tools/ifc-tools/src/ifc_tools/templates/`.
