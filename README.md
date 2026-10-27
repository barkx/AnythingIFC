# IFCWise

From drawings to IFC. Upload CAD drawings, PDF plans, sketches or a text description and get an IFC
building model back.

- **ifcwise.com** — landing page (`apps/www`, Vercel)
- **app.ifcwise.com** — web app (`apps/app`, runs locally, published via Cloudflare Tunnel)

Start with [PLAN.md](PLAN.md) (architecture) and [TASKS.md](TASKS.md) (progress).
Coding agents: see [AGENTS.md](AGENTS.md).

## Requirements

- Node.js 22+ (24 recommended) and npm
- [uv](https://docs.astral.sh/uv/) (downloads Python 3.12 for `tools/ifc-tools`)
- Windows PC for the app host (Revit 2025/2026 + Revit MCP, Blender + Bonsai for conversions)

## Run locally

```bash
npm install
cp apps/app/.env.example apps/app/.env.local
cp apps/www/.env.example apps/www/.env.local
npm run dev
```

- Landing page: http://localhost:3000
- App: http://localhost:3001 (health check: `/api/health`)

## Checks

```bash
npm run typecheck
npm run lint
npm run build
npm run tools -- --help
```
