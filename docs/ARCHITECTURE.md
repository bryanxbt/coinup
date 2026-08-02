# CoinUp Architecture

## High-level

```
┌─────────────────────────────────────────────────────────────┐
│  CoinUp Web (Next.js, static export OK)                     │
│  Floor 1 Cabinet Hall · Floor 2 Card Room UI                │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │ HTTPS/WSS + Bearer
                ▼                             ▼
        Game modules                    card-room-api (server/)
     (Floor 1 registry)                 ledger · auth · agents · tables
                │                             │
                └────────────┬────────────────┘
                             ▼
                   Arch Network (localnet → testnet → mainnet)
                   Bitcoin UTXO settlement (integer sats)
```

## Dual-deploy (locked)

| Surface | Host | Notes |
|---------|------|--------|
| Web | GitHub Pages / static | `output: "export"` in `next.config.ts` |
| Card Room API | Node process (`server/`) | Postgres required for ledger; Redis optional |
| Arch | local_validator / testnet | See `docs/LOCAL_ARCH.md` |

Floor 1 may keep browser mock credits during transition. Floor 2 money ops **must** go through the server ledger (PR 2+). **No second balance key** — sats only.

## Frontend routes

| Path | Floor | Shell |
|------|-------|--------|
| `/` | Landing typewriter | root only |
| `/arcade` | Cabinet Hall | `ArcadeShell` via `(arcade)/layout.tsx` |
| `/play/[gameId]` | Arcade cabinets | ArcadeShell |
| `/brand` | Brand book | ArcadeShell |
| `/card-room/*` | Card Room / The Pit | `CardRoomShell` via `(card-room)/layout.tsx` |

Root `layout.tsx` is chrome-free so Card Room never inherits CRT/neon.

**Production link:** UI loads `card-room-runtime.json` (or `NEXT_PUBLIC_CR_*`) for API base — see `docs/DUAL_DEPLOY.md`.

## Card Room API (`server/`)

| Endpoint | Role |
|----------|------|
| `GET /health` | Liveness |
| `GET /v1/status` | Arch probe + mode |
| `GET /v1/ready` | Readiness |
| Later | Auth, ledger, agents, tables, WS |

Default: `http://127.0.0.1:8787`

Env: `server/.env.example`, root `.env.example` for `NEXT_PUBLIC_CR_*`.

## Payments (target model)

| Action | Description |
|--------|-------------|
| `deposit` | Player locks BTC/sats into arcade credits |
| `insertCoin` | Floor 1: debit credits for a play session |
| `buyIn` / `cashOutTable` | Floor 2 table stacks (server ledger) |
| `tournamentEntry` / `claim` | Floor 2 events |
| `lockBacking` / `release` | V1.1+ confidence product |
| `withdraw` | Credits → player Bitcoin (wallet bind required) |

v0 Floor 1 uses **mock credits** in the browser (`src/lib/payments/mock.ts`).  
Floor 2 uses server authority — see `docs/CARD_ROOM_DESIGN.md`.

## On-chain (planned)

`programs/` will hold Arch Rust programs for:

- Arcade treasury / credit ledger
- Card Room pots + escrow
- Settlement instruction map (design doc Arch Spec v0)

Exact account model TBD against Arch SDK — ledger is source of truth until programs land.

## Local development

Full Arch walkthrough: **`docs/LOCAL_ARCH.md`**.

```bash
colima start
source /Volumes/BryanXBTLacie/archie/scripts/env.sh
bash /Volumes/BryanXBTLacie/archie/scripts/start-local-devnet.sh
npm run dev:all
```

## Extending Floor 1 games

1. Add a folder under `src/games/<id>/`
2. Implement `GameModule` and export from `registry.ts`
3. Set `costSats`, art, and controls
4. Wire score → `submitScore` when the run ends

## Design source of truth

- Floor 2 product/system: `docs/CARD_ROOM_DESIGN.md`
- Brand books: `docs/brand-book/` (+ Jack / Floor 2 amendments)
- Visual Floor 1: `public/images/brand-book-v1.jpg`
