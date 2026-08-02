# CoinUp Arch programs

On-chain programs for arcade credits, pots, and payouts on [Arch Network](https://arch.network).

## Planned programs

| Program | Role |
|---------|------|
| `arcade-credits` | Deposit / withdraw sat credits, debit on insert-coin |
| `arcade-pots` | Tournament / jackpot pot configuration and claims |
| `score-board` | Optional score commitments and ranking hooks |
| `card-room-escrow` | Floor 2 buy-in locks, backing escrow, settle (design: CARD_ROOM_DESIGN) |

## Status

Empty scaffold. Floor 1 uses browser `mockPaymentClient`; Floor 2 uses **server ledger** (`server/`) until Arch programs land. Local Arch: `docs/LOCAL_ARCH.md`.

See `docs/ARCHITECTURE.md` and `docs/CARD_ROOM_DESIGN.md` for settlement flow.
