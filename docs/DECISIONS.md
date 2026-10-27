# Decisions

Short log of architecture and convention decisions. Newest at the top.
Format: date — decision — why — consequences.

## 2026-10-27 — Local-first proof of concept, no Supabase
- **Decision:** `apps/app` runs on the owner's Windows PC with SQLite and files in `C:\IFCWiseData`;
  published as app.ifcwise.com through a Cloudflare Tunnel. Landing page on Vercel.
- **Why:** PoC with manual processing; uploads should land directly in the local folder; no cloud costs or accounts.
- **Consequences:** app is offline when the PC is off; ifcwise.com DNS must move to Cloudflare;
  100 MB per-request upload limit on Cloudflare free plan. Data layer kept swappable (Drizzle + `storage.ts`).

## 2026-10-27 — Invite-code login
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
