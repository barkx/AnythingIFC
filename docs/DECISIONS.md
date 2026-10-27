# Decisions

Short log of architecture and convention decisions. Newest at the top.
Format: date — decision — why — consequences.

## 2026-10-27 — Public projects on Vercel, PC for computation only (supersedes local-first + invite codes)
- **Decision:** `apps/app` runs on Vercel. Anyone can create a project; all projects are public and appear in
  the gallery after admin approval. Storage is Vercel Blob only (`project.json` per project, no database).
  Creators give a display name (public) and email (AES-256-GCM encrypted, admin-only) and get a secret manage
  link. Projects are kept until the creator or admin deletes them. The owner's PC pulls projects with
  `ifc-tools pull` and the admin uploads results through the admin page.
- **Why:** the owner doesn't want to host the service on a PC; public projects remove the need for accounts
  and build a gallery of examples.
- **Consequences:** no Cloudflare Tunnel; DNS can stay on Vercel. Uploads go browser → Blob directly (Vercel's
  4.5 MB function body limit doesn't apply). Spam handled by approval gate, rate limits, honeypot, optional
  Turnstile. Terms must cover public display. Vercel Hobby is non-commercial — Pro before charging.

## 2026-10-27 — Public GitHub repo barkx/AnythingIFC
- **Decision:** code lives in the public repo https://github.com/barkx/AnythingIFC (product name stays IFCWise).
- **Why:** the user's chosen repo.
- **Consequences:** never commit secrets, customer files or real invite codes; `.env.local` stays gitignored.
  Revisit (make private) before adding anything proprietary such as Revit templates or prompts.

## 2026-10-27 — Landing page design tokens
- **Decision:** stone neutrals + teal accent (`#0f766e` light / `#2dd4bf` dark) as CSS variables in
  `apps/www/src/app/globals.css`, exposed to Tailwind via `@theme inline`; Geist Sans/Mono.
- **Why:** calm, technical look; one accent keeps the IFC message clear. Reuse the same tokens in `apps/app`.

## 2026-10-27 — ~~Local-first proof of concept, no Supabase~~ (superseded)
- **Decision:** `apps/app` runs on the owner's Windows PC with SQLite and files in `C:\IFCWiseData`;
  published as app.ifcwise.com through a Cloudflare Tunnel. Landing page on Vercel.
- **Why:** PoC with manual processing; uploads should land directly in the local folder; no cloud costs or accounts.
- **Consequences:** app is offline when the PC is off; ifcwise.com DNS must move to Cloudflare;
  100 MB per-request upload limit on Cloudflare free plan. Data layer kept swappable (Drizzle + `storage.ts`).

## 2026-10-27 — ~~Invite-code login~~ (superseded)
- **Decision:** no passwords or magic links; admin issues single-use invite codes; sessions in SQLite.
- **Why:** simplest secure option for a small tester group; no email provider required.
- **Consequences:** lost sessions are recovered by issuing a new code to the same email.

## 2026-10-27 — npm workspaces, no Turborepo
- **Decision:** plain npm workspaces.
- **Why:** pnpm not installed; two apps don't need a build orchestrator.

## 2026-10-27 — Two conversion routes
- **Decision:** Route A Codex + Revit MCP, Route B Blender + Bonsai/IfcOpenShell; compared on the first test jobs.
- **Why:** Revit is the user's tool; Bonsai has no licensing limits for later automation.

## 2026-10-27 — Human in the loop
- **Decision:** no unattended Codex (ChatGPT plan) or Revit runs on customer jobs in the PoC.
- **Why:** terms of service of ChatGPT plans and Revit desktop licences. Revisit with OpenAI API / APS Design Automation.
