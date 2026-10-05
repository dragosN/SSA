# SSA Operations Dashboard

Mini Space Situational Awareness ops dashboard for interview demos: live Cesium orbital picture, SGP4 in a Web Worker, and (later) Python conjunction screening.

## Quick start (Phase 1)

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173 — catalogue loads from CelesTrak via the Vite `/celestrak` proxy.

## Repo layout

| Path | Role |
|------|------|
| `apps/web` | Vite + React + Cesium/Resium + RTK |
| `services/conjunction` | FastAPI screener (Phase 2+) |
| `docs/` | Plan + architecture |
| `scenarios/` | Replay datasets (Phase 3) |

## Phase status

- **Phase 1:** Cesium globe, CelesTrak GP, SGP4 worker, filters, 2D/3D, health strip
- **Phase 2–4:** See [docs/plan.md](docs/plan.md)

## Docs

- [Architecture](docs/architecture.md)
- [Full plan](docs/plan.md)
