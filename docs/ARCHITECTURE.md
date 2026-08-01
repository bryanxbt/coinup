# CoinUp Architecture

## High-level

```
┌─────────────────────────────────────────────────────────┐
│  CoinUp Web (Next.js)                                   │
│  Lobby · Cabinets · Wallet UI · Leaderboards            │
└───────────────┬─────────────────────────┬───────────────┘
                │                         │
                ▼                         ▼
        Game modules                 Payment client
     (registry + engines)         (sats credits API)
                │                         │
                └────────────┬────────────┘
                             ▼
                   Arch Network programs
              (deposit · play · score · payout)
                             │
                             ▼
                      Bitcoin settlement
```

## Frontend

- **Lobby** (`/`) — catalog of cabinets, balance, featured pots
- **Play** (`/play/[gameId]`) — mounts a registered game with a credit session
- **Games** — each cabinet implements a small interface (`GameModule`):
  - metadata (title, cost in sats, tags)
  - React mount surface
  - optional score submit hook

## Payments (target model)

| Action | Description |
|--------|-------------|
| `deposit` | Player locks BTC/sats into arcade credits |
| `insertCoin` | Debit credits for a play session |
| `submitScore` | Commit run result (hash / proof as design matures) |
| `claimReward` | Pay tournament / jackpot winners |
| `withdraw` | Credits → player Bitcoin |

v0 uses **mock credits** in the browser so UX and games can ship before mainnet programs land. Types live in `src/lib/payments/`.

## On-chain (planned)

`programs/` will hold Arch eBPF / Rust programs for:

- Arcade treasury / credit ledger
- Per-game pot configuration
- Score escrow and payout rules

Exact account model TBD against current Arch SDK docs.

## Extending with a new game

1. Add a folder under `src/games/<id>/`
2. Implement `GameModule` and export from `registry.ts`
3. Set `costSats`, art, and controls
4. Wire score → `submitScore` when the run ends
