# CoinUp

**Insert Bitcoin. Play. Win Bitcoin.**

Virtual arcade games for [Arch Network](https://arch.network) — Bitcoin as the payment and rewards token for every game.

## Vision

CoinUp is an on-chain arcade: players insert satoshis to play classic and original cabinet-style games, climb leaderboards, and cash out rewards in BTC. Settlement stays Bitcoin-native via Arch — no bridges, no synthetic play-money.

| Pillar | Meaning |
|--------|---------|
| **Play with BTC** | Entry fees and credits are real satoshis |
| **Win with BTC** | High scores, tournaments, and jackpots pay out in Bitcoin |
| **Arch-native** | Smart contract logic and settlement on Arch Network |
| **Cabinet culture** | Retro arcade feel with modern multiplayer rails |
| **Chip** | Floor boss — Chip the Arcade Manager greets every player |

## Stack

- **Frontend** — Next.js (App Router), TypeScript, Tailwind CSS
- **Games** — Modular client games registered in a shared arcade lobby
- **Payments / rewards** — Bitcoin via Arch Network programs (scaffolded)
- **Deploy** — Static-friendly build path for GitHub Pages or any host

## Develop

```bash
npm install
npm run dev          # Floor 1 + Card Room UI (Next)
# Optional parallel API:
npm run dev:api      # Card Room backend :8787
# Or both (API backgrounded):
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) (arcade main floor) and  
[http://localhost:3000/card-room](http://localhost:3000/card-room) (**The Pit** — Card Room).

### Live preview (GitHub Pages)

| Surface | URL |
|---------|-----|
| Arcade | https://bryanxbt.github.io/coinup/ |
| **Card Room / The Pit** | https://bryanxbt.github.io/coinup/card-room/ |

Static UI only on Pages. Live tables/ledger need the Card Room API (`server/`) elsewhere for full play; UI still loads for browsing.

**Local Arch Network** (Bitcoin regtest + Titan + local_validator): see [`docs/LOCAL_ARCH.md`](docs/LOCAL_ARCH.md).

```bash
npm run build
npm start
```

## Project layout

```
src/
  app/
    (arcade)/          # Floor 1 Cabinet Hall routes
    (card-room)/       # Floor 2 Card Room UI
  components/          # ArcadeShell + CardRoomShell
  games/               # Floor 1 game registry
  lib/payments/        # Sats types, mock + Arch stubs
  lib/card-room/       # Floor 2 brand tokens
server/                # Card Room API (ledger, agents, tables — dual-deploy)
docs/                  # Vision, architecture, Card Room design, local Arch
programs/              # Arch Network on-chain programs (scaffold)
```

## Brand

CoinUp is a **living entertainment brand** (not only a product UI).

| Asset | Role |
|-------|------|
| **`/brand`** | Navigable Brand Book (web) |
| **`docs/brand-book/`** | Chapters 00–25 (80–120 page target) |
| **`public/images/brand-book-v1.jpg`** | Official visual Brand Book v1.0 |
| **`src/lib/brand.ts`** | Colors, type, roster, values |

### Mission

> Build the greatest digital arcade ever. All games. All people. All the time.

### Mascot

**Chip the Arcade Manager** — `public/images/chip-arcade-manager.png`

## Status

Lobby + playable cabinets + full Floor 1 brand book. **Floor 2 Card Room** shell + dual-deploy API skeleton + local Arch docs. Server ledger / engine / Arch programs still building out (see `docs/CARD_ROOM_DESIGN.md`).

## Project docs

| Doc | Role |
|-----|------|
| `docs/brand-book/` | Living brand bible |
| `docs/VISION.md` | Product vision |
| `docs/ARCHITECTURE.md` | Technical shape |

## Links

- Repo: [github.com/bryanxbt/coinup](https://github.com/bryanxbt/coinup)
- Arch Network: [arch.network](https://arch.network)

## License

MIT — Build Together Labs
