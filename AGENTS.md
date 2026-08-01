# CoinUp — agent notes

Virtual Bitcoin arcade for Arch Network. Build Together Labs.

## Product

- Brand: **CoinUp** / **CoinUp Arcade** (never Archade)
- **Brand guide (source of truth):** `docs/BRAND.md`
- **Visual brand board:** `public/images/brand-guide-concept.jpg` (treat as brand book even though it’s a single concept graphic)
- Code tokens: `src/lib/brand.ts`
- Taglines: see brand guide — product = *Insert Bitcoin. Play. Win Bitcoin.*; floor = *Insert coin to continue.*
- Mission: *Build the greatest digital arcade ever. All games. All people. All the time.*
- Token for play + rewards: **Bitcoin (sats)**
- Chain: **Arch Network**
- Mascot: **Chip the Arcade Manager**
  - Hero: `public/images/chip-arcade-manager.png`
  - Helpers: `src/components/Chip.tsx`
  - Expressions: thinking / hyped / determined / sleep (ERROR 404: SLEEP)
  - Keep pixel-crisp; blue + gold varsity; don’t invent a second mascot

## Game naming

Official forever roster (only these titles for the announced lineup):

Coin Drop · Sat Hunter · Pixel Racer · Rocket Run · Orange Mines · Memory Matrix · Block Stacker · Lightning Reflex

Map prototypes onto these IDs (`coin-drop`, `block-stacker`, …). Don’t ship parallel names (e.g. “Coin Catch” vs “Coin Drop”).

## Stack conventions

- Next.js App Router, TypeScript, Tailwind
- Games in `src/games/` via `registry.ts`
- Payments in `src/lib/payments/` — integer sats only
- Docs in `docs/`; on-chain in `programs/`

## Do

- When brand is ambiguous, match `docs/BRAND.md` + the concept board
- Keep arcade / neon / cabinet aesthetic
- Modular game plugins
- Mock credits until Arch programs are wired

## Don’t

- Rename the product to Archade
- Non-BTC primary currencies without an explicit product decision
- Soften Chip into non-pixel corporate art without a deliberate art pass
- Commit secrets, keys, or funded mnemonics
