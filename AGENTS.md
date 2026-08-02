# CoinUp — agent notes

Living entertainment brand: Bitcoin arcade on Arch Network. Build Together Labs.

## Product

- **CoinUp / CoinUp Arcade** (never Archade)
- Domain: coinuparcade.com
- Tagline site: *The Internet's Bitcoin Arcade*
- Mission: *Build the greatest digital arcade ever. All games. All people. All the time.*
- Currency: Bitcoin (sats) · Chain: Arch Network
- Mascot (Floor 1): **Chip the Arcade Manager**
- Host (Floor 2 Card Room): **Jack the Dealer** — premium club, not neon

## Brand system (read first)

| Priority | Asset |
|----------|--------|
| 1 | `public/images/brand-book-v1.jpg` — official visual brand book |
| 2 | `docs/brand-book/` — full chapter bible (00–25) |
| 3 | Web edition `/brand` |
| 4 | `src/lib/brand.ts` — tokens (must match v1 palette) |
| 5 | `public/images/chip-arcade-manager.png` |

Flagship chapters: **03 World**, **07 Pixel System**, **08 Chip Bible**.

### Brand Book v1 palette (primary)

`#FCC76E` gold · `#FF5A00` orange · `#2962FF` blue · `#FF4EC7` pink · `#00DE76` green  
Dark UI void: `#000012`

### Type

Display: Coinup Pixel · Subhead/UI: Press Start 2P · Body: Inter

### Pixel law (non-negotiable)

One pixel = one solid hex · no AA · no blur/glow on sprites · no gradients in pixel art · nearest-neighbor scale · sizes 16/32/64/128 (+ 24/48)

### Forever roster names only

Coin Drop · SOLE Dodgeball · Pixel Racer · Rocket Run · Crazy Wheel · Memory Matrix · Block Stacker · Rock Paper Scissors

## Floors

| Floor | Name | Host | Path | Visual |
|-------|------|------|------|--------|
| 1 | Cabinet Hall | Chip | `/`, `/play/*` | Neon CRT (`ArcadeShell`) |
| 2 | Card Room | Jack | `/card-room/*` | Emerald/walnut/gold (`CardRoomShell`) |

Floor 2 design: `docs/CARD_ROOM_DESIGN.md` · Local Arch: `docs/LOCAL_ARCH.md` · API: `server/`

## Stack

Next.js App Router, TypeScript, Tailwind · games in `src/games/` · Card Room API in `server/` · payments integer sats · Arch localnet via archie tooling · programs later in `programs/`

## Don't

- Archade rename · non-BTC primary currency · second pixel palette · blur Chip · commit secrets
