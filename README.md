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

**Source of truth:** [`docs/BRAND.md`](docs/BRAND.md)

The visual “brand book” is a single concept board (not a formal PDF):

`public/images/brand-guide-concept.jpg`

It defines the forever game roster, Chip.EXE expressions, Chip’s gear, Day 1 story, and mission lockup. Code mirrors it in `src/lib/brand.ts`.

### Mascot

**Chip the Arcade Manager** — `public/images/chip-arcade-manager.png`  
CRT-head robot, COINUP ARCADE hat, all-access badge. Floor host and header mark.

### Mission

> Build the greatest digital arcade ever. All games. All people. All the time.

## Status

Early scaffold. Brand guide, lobby, Chip, and forever roster are in place. Two playable prototypes (**Coin Drop**, **Block Stacker**). Bitcoin payment rails and Arch programs are typed stubs.

## Project docs

| Doc | Role |
|-----|------|
| `docs/BRAND.md` | Brand guide |
| `docs/VISION.md` | Product vision |
| `docs/ARCHITECTURE.md` | Technical shape |

## Links

- Repo: [github.com/buildtogetherlabs/coinup](https://github.com/buildtogetherlabs/coinup)
- Arch Network: [arch.network](https://arch.network)
- Build Together Labs: [github.com/buildtogetherlabs](https://github.com/buildtogetherlabs)

## License

MIT — Build Together Labs
