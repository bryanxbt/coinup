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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## Project layout

```
src/
  app/                 # Next.js routes (lobby + play)
  components/          # Arcade UI shell
  games/               # Game registry + individual games
  lib/payments/        # BTC credit / reward types and Arch stubs
docs/                  # Vision and architecture notes
programs/              # Future Arch Network on-chain programs
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

Lobby + two playable prototypes (**Coin Drop**, **Block Stacker**) + full brand book architecture. Arch payment programs still stubs.

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
