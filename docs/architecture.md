# SSA Operations Dashboard — Architecture

## Purpose

Interview-oriented Space Situational Awareness (SSA) ops dashboard: live orbital picture in Cesium, SGP4 propagation off the main thread, conjunction screening via Python, and role-configurable control-room layouts.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Vite + React + TypeScript | SPA fits Cesium; no SSR/WebGL friction |
| Globe | Cesium + Resium | Industry-standard 3D geospatial |
| Propagation | satellite.js (SGP4) in a Web Worker | Smooth updates for thousands of objects |
| State | Redux Toolkit | Named in target job postings; fits catalogue/alert streams |
| UI | MUI dark theme | Dense, low-glare control-room chrome |
| Backend | FastAPI (Phase 2+) | Python data integration + REST/WebSocket |
| Deploy | Docker Compose + GitHub Actions | Reproducible demo stack |

## Module map

```
apps/web/src/
  features/catalogue/     # TLE fetch, orbit regime helpers, RTK slice
  features/filters/       # regime / operator / search
  features/viewer/        # 2D/3D, selected object, camera
  features/health/        # feed age, last update, failures
  cesium/                 # Resium Viewer, entity layers, orbit paths
  workers/                # SGP4 propagation worker
  theme/                  # MUI control-room theme
  config/                 # role layouts (Phase 3)
services/conjunction/     # FastAPI adapters + screener (Phase 2+)
```

## Data-source adapter pattern (Phase 2+)

Backends plug in via a `CatalogueAdapter` protocol:

- `fetch_element_sets() -> list[ElementSet]`
- `source_id` / `health()` metadata

`CelesTrakAdapter` is the first implementation. A federated or mock source is another adapter with the same interface — no UI changes required.

## Security thinking

- **No secrets in the client.** Public CelesTrak URLs and the FastAPI base URL only.
- **Auth boundary** at the API (Phase 2+/3): role claims checked server-side before screening or report generation.
- **CORS** env-configured for known origins.
- Role-based layouts are presentation-only until backed by real RBAC.

## Phase status

- **Phase 1 (done):** Cesium globe, CelesTrak GP, SGP4 worker, filters, 2D/3D toggle, health strip.
- **Phase 2:** Conjunction service, alerts, timeline.
- **Phase 3:** Roles, multi-screen sync, exercise/replay.
- **Phase 4:** Reporting, tests, CI hardening.

See [plan.md](./plan.md) for the full roadmap.
