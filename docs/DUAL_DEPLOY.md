# Dual-deploy: GitHub Pages + Card Room API

CoinUp UI is a **static export** on GitHub Pages. Card Room money, agents, tables, and WebSockets live on a **separate Node API** (`server/`).

```
https://bryanxbt.github.io/coinup/     → static Next export
                │
                │  HTTPS + Bearer  /  WSS
                ▼
https://<api-host>/                   → server/ (Hono + WS)
```

## Local

```bash
npm run dev:all
# UI  http://localhost:3000
# API http://127.0.0.1:8787/health
```

Localhost never reads `card-room-runtime.json` for the API URL — it always uses `http://127.0.0.1:8787` unless `NEXT_PUBLIC_CR_API_URL` is set.

## Production topology

| Surface | Host | Config |
|---------|------|--------|
| Web | GitHub Pages | `.github/workflows/deploy-pages.yml` |
| API | Fly.io (default) | `server/fly.toml` + `server/Dockerfile` |
| Link | runtime JSON or build env | `public/card-room-runtime.json` / secrets |

### 1. Create Fly app (once)

```bash
export PATH="$HOME/.fly/bin:$PATH"
fly auth login
fly apps create coinup-card-room-api
fly secrets set SESSION_SECRET="$(openssl rand -hex 32)" -a coinup-card-room-api
# optional override:
# fly secrets set CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,https://bryanxbt.github.io" -a coinup-card-room-api
```

### 2. Deploy API

```bash
cd server
fly deploy
```

Health: `https://coinup-card-room-api.fly.dev/health`

CI: set repo secret `FLY_API_TOKEN` (Fly → Account → Access Tokens). Workflow `.github/workflows/deploy-api.yml` deploys on `server/**` pushes.

### 3. Point Pages UI at the API

GitHub repo → **Settings → Secrets and variables → Actions**:

| Secret | Example |
|--------|---------|
| `CR_API_URL` | `https://coinup-card-room-api.fly.dev` |
| `FLY_API_TOKEN` | (API deploy only) |
| `NEXT_PUBLIC_CR_API_URL` | optional bake-in (same as CR_API_URL) |
| `NEXT_PUBLIC_PAYMENTS_MODE` | `mock` |

On each Pages build, `CR_API_URL` is written into `public/card-room-runtime.json` so the static site knows where to call.

You can also commit a filled `public/card-room-runtime.json` (not secrets — the API URL is public).

### 4. CORS

API env `CORS_ORIGINS` must include the exact browser origin:

- `https://bryanxbt.github.io`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

Defaults already include these.

## Env reference

### Web (static)

| Var | Role |
|-----|------|
| `NEXT_PUBLIC_CR_API_URL` | Build-time API base (optional if runtime JSON set) |
| `NEXT_PUBLIC_CR_WS_URL` | Build-time WS URL |
| `NEXT_PUBLIC_PAYMENTS_MODE` | Banner / mode label |
| `public/card-room-runtime.json` | Runtime override on non-localhost |

### API (`server/`)

| Var | Role |
|-----|------|
| `PORT` / `HOST` | Listen (`0.0.0.0` in production) |
| `CORS_ORIGINS` | Comma-separated exact origins |
| `SESSION_SECRET` | Bearer session HMAC material |
| `PAYMENTS_MODE` | `mock` \| arch modes |
| `DATABASE_URL` | Optional Postgres |
| `REDIS_URL` | Optional fanout |

## Notes

- **Mock ledger is in-memory** — free-tier machine restarts wipe agents/tables/sats. Fine for demo; use Postgres for persistence.
- Free Fly machines **auto-stop**; first request after idle may take a few seconds (cold start).
- Floor 1 arcade cabinets still use browser mock credits; Floor 2 always hits the server ledger.
