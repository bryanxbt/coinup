# Local Arch Network development (Card Room)

CoinUp settles **Bitcoin (sats)** on **[Arch Network](https://arch.network)**.  
Official docs: [docs.arch.network](https://docs.arch.network) · [Arch Book](https://book.arch.network).

This machine already has Ship/Archie tooling on the LaCie volume.

## Stack (local)

| Component | Default | Role |
|-----------|---------|------|
| **bitcoind** (regtest) | `:18443` | Bitcoin UTXO base |
| **Titan** | `:8080` | Indexer / tip |
| **local_validator** | `:9002` | Arch RPC (ArchVM) |
| **Card Room API** | `:8787` | Ledger, agents, tables (this repo `server/`) |
| **Next.js web** | `:3000` | Floor 1 + Floor 2 UI (static-export friendly) |

Dual-deploy: Next stays `output: "export"` for GitHub Pages; Card Room **never** puts money authority in the browser. The API is the ledger authority.

## One-time / daily start

```bash
# 1) Colima + Docker (bitcoind + titan)
colima start

# 2) Arch localnet (native local_validator + compose)
source /Volumes/BryanXBTLacie/archie/scripts/env.sh
bash /Volumes/BryanXBTLacie/archie/scripts/start-local-devnet.sh

# 3) Optional Postgres for ledger (PR 2+)
cd /Users/bmelliott/Projects/coinup/server
docker compose up -d

# 4) Card Room API + web
cd /Users/bmelliott/Projects/coinup
cp -n .env.example .env.local 2>/dev/null || true
cp -n server/.env.example server/.env 2>/dev/null || true
npm install
npm install --prefix server
npm run dev:all
```

Stop Arch stack:

```bash
bash /Volumes/BryanXBTLacie/archie/scripts/stop-local-devnet.sh
```

## Smoke checks

```bash
# API
curl -s http://127.0.0.1:8787/health | jq .
curl -s http://127.0.0.1:8787/v1/status | jq .

# Auth + ledger (bearer required for money ops)
TOKEN=$(curl -s -X POST http://127.0.0.1:8787/v1/auth/session \
  -H 'content-type: application/json' \
  -d '{"guestId":"player_local"}' | jq -r .token)
curl -s http://127.0.0.1:8787/v1/auth/me -H "Authorization: Bearer $TOKEN" | jq .
curl -s -X POST http://127.0.0.1:8787/v1/ledger/faucet \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"amountSats":50000,"idempotencyKey":"f1"}' | jq .

# Titan
curl -s http://127.0.0.1:8080/tip

# Arch CLI (after env.sh)
export PATH="/Volumes/BryanXBTLacie/archie/tools/bin:$PATH"
arch-cli --version
# arch-cli get-block-height   # when profile points at local
```

## Env mapping

| Variable | Service | Example |
|----------|---------|---------|
| `ARCH_RPC_URL` | API | `http://127.0.0.1:9002` |
| `TITAN_URL` | API | `http://127.0.0.1:8080` |
| `BITCOIN_RPC_URL` | API | `http://127.0.0.1:18443` |
| `PAYMENTS_MODE` | API | `mock` → `arch-localnet` |
| `NEXT_PUBLIC_CR_API_URL` | Web | `http://127.0.0.1:8787` |
| `NEXT_PUBLIC_PAYMENTS_MODE` | Web | match API |

## Payment modes

1. **`mock`** — server ledger (PR 2) with demo faucet; no chain required for UI  
2. **`arch-localnet`** — settle buy-in / pots / withdraw against local Arch programs (PR 16+)  
3. **`arch-testnet` / `arch-mainnet`** — remote RPC; counsel + feature flags for mainnet cash  

Currency is always **integer satoshis**. No parallel token.

## Programs

On-chain programs live in `programs/` (scaffold). Arch Rust programs deploy with `arch-cli` once the settlement instruction map lands. See `docs/CARD_ROOM_DESIGN.md` Arch Settlement Spec and `programs/README.md`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `colima is not running` | `colima start` |
| bitcoind connection refused `:18443` | Start local devnet script |
| local_validator missing | Ensure LaCie mounted; `source …/archie/scripts/env.sh` |
| CORS errors from Next | Add origin to `CORS_ORIGINS` on API |
| GLIBC docker local_validator | Use **native** `tools/bin/local_validator` (Ship script already does) |
