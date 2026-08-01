# CoinUp Vision

## One-liner

A Bitcoin arcade on Arch Network: insert sats, play virtual cabinets, win sats.

## Why

Most crypto games abstract money into points or wrapped tokens. CoinUp treats **Bitcoin itself** as the coin slot and the prize counter. Arch Network provides programmable rails so entry fees, pots, and payouts can settle against native BTC without bridging away from Bitcoin’s security model.

## Player loop

1. **Fund** — connect wallet / deposit sats into arcade credits  
2. **Pick a cabinet** — browse games in the lobby  
3. **Insert coin** — spend credits (sats) to start a run  
4. **Play** — local or skill-based sessions; scores submitted on-chain when ready  
5. **Win** — leaderboard prizes, tournament pots, progressive jackpots in BTC  
6. **Cash out** — withdraw remaining credits + rewards to Bitcoin

## Design principles

- **Sats are first-class** — UI and contracts speak satoshis, not vague “coins”
- **Fair play** — verifiable scores / seeds where it matters; house rules transparent
- **Modular cabinets** — each game is a plugin with a shared credit + score API
- **Arcade soul** — neon, cabinets, “INSERT COIN” — not a generic DeFi dashboard
- **Chip runs the floor** — Chip the Arcade Manager is the mascot host (not a faceless protocol UI)
- **Brand is the board** — visual identity follows `docs/BRAND.md` + the concept board (forever roster, gear, expressions)
- **Build in public** — Day 1 energy; community cabinets and seasonal tournaments welcome

## Non-goals (v0)

- Full custodial casino / unregulated gambling product framing
- Non-Bitcoin payment rails as the primary path
- AAA 3D fidelity on day one — start with tight 2D / retro skill games

## Near-term milestones

1. Lobby + game registry (this scaffold)
2. Local playable cabinets with mock credits
3. Arch program: credit deposit / spend / score escrow
4. First tournament pot (fixed entry, top-N payout)
5. Public testnet launch on Arch
