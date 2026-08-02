# 09 — World Building

Spatial canon for the CoinUp Arcade. Designers and writers treat these as real rooms.

## Floor plan (logical)

```
[LOADING DOCK] → [LOBBY / CHIP DESK] → [CABINET HALL]     ← Floor 1 (Chip)
                      ↓
              [TOURNAMENT ARENA]
                      ↓
         [PRIZE COUNTER] [MANAGER OFFICE]
                      ↓
              [STORAGE / SPARKS BAY]
                      ↓
         ═══════════════════════════════
                      ↓
              [CARD ROOM]                                 ← Floor 2 (Jack the Dealer)
                 Lobby · Live Tables · Jack's Office
```

## Spaces

| Space | Function | Visual notes |
|-------|----------|--------------|
| **Lobby** | Wallet connect, balance, Chip greeting | Marquee, INSERT COIN CTA |
| **Cabinet hall** | Game grid | Neon, carpet pattern, rows |
| **Tournament area** | Brackets, finals | Stage lights, Vox energy |
| **Prize counter** | Rewards, merch tease | Tickets, tokens, glass case |
| **Manager office** | Chip desk, ALL ACCESS lore | Badge rack, CRT stack |
| **Storage** | Sparks domain | Tools, open cabinets |
| **Loading dock** | New cabinets arrive | Trucks, “JUST ARRIVED” |
| **Construction / Day 1 lot** | Origin | Dirt, blueprints, skyline |
| **Card Room (Floor 2)** | AI strategy club — agents play cards | Emerald felt, walnut, brass, gold; Jack hosts |
| **Jack's Office** | House rules, fairness, announcements | Quiet, dark wood, no neon |
| **Bathrooms** | Optional comedy lore only | Keep brand-safe |

## Blueprints

Day 1 prop: blueprint blue `#1E3A5F` / cyan lines. Use in about pages, construction posts.

## Cabinet layout rules

- Marquee top, side art, control deck, coin door with **C**  
- Aisle width in art: show more than one cabinet for “floor” feel  
- Exit signs / neon HIGH SCORE wall art encouraged  

## Product UX — The Floor (canonical lobby)

The **home experience is the arcade floor**, not a SaaS card grid.

| Rule | Spec |
|------|------|
| **Primary surface** | Interactive **Cabinet Hall** — pixel carpet, aisles, wall neon |
| **Cabinets** | Clickable machines; live → `/play/[id]`; soon → status only (WIP tape) |
| **Layout source** | `src/lib/arcade-floor.ts` (`FLOOR_SLOTS` col/row map) |
| **Component** | `ArcadeFloor` + `PixelCabinet` |
| **Chip** | On the floor at the manager desk (not only in a hero portrait) |
| **Status bar** | CRT green line: selection feedback (“LIVE · INSERT SATS” / “STILL WIRING”) |
| **Legend** | LIVE vs COMING SOON counts |
| **Do not** | Replace the floor with generic marketplace cards as the main lobby |

CEO translation (internal): *“A layout of the arcade where you see a pixelated floor and click cabinets to play.”*  
Brand translation: **walk the aisle, pick a machine, insert sats.**

## Expansion

New games = new cabinets on the plan (`FLOOR_SLOTS` + roster), announced as **NEW CABINET JUST ARRIVED**.

**Floor 2 Card Room** expands via strategy game plugins (Hold'em first), not cabinets. Enter from the floor switcher (F1 ↔ F2) or `/card-room`. Currency remains **sats on Arch** — same arcade economy, different room.
