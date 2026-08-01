# CoinUp — agent notes

Virtual Bitcoin arcade for Arch Network. Build Together Labs.

## Product

- Brand: **CoinUp** (not Archade)
- Tagline: Insert Bitcoin. Play. Win Bitcoin.
- Token for play + rewards: **Bitcoin (sats)**
- Chain: **Arch Network**

## Stack conventions

- Next.js App Router, TypeScript, Tailwind
- Games are modules in `src/games/` registered in `registry.ts`
- Payment types in `src/lib/payments/` — prefer sats (integer) over BTC floats
- Docs in `docs/`; on-chain work will land in `programs/`

## Do

- Keep arcade / neon / cabinet aesthetic coherent
- Prefer modular game plugins over one monolith page
- Mock credits until Arch programs are wired

## Don’t

- Rename the product back to Archade
- Introduce non-BTC primary currencies without an explicit product decision
- Commit secrets, private keys, or funded wallet mnemonics
