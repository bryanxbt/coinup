# CoinUp Brand Guide

This is the **source of truth** for CoinUp visual identity, voice, and product naming.

It is **not** a formal brand book. The canonical visual reference is the concept board:

**[`public/images/brand-guide-concept.jpg`](../public/images/brand-guide-concept.jpg)**

Treat that board like a wall poster in the shop: when something is ambiguous, match the board.

Companion hero: **[`public/images/chip-arcade-manager.png`](../public/images/chip-arcade-manager.png)** — Chip front portrait.

Code constants mirror this file in [`src/lib/brand.ts`](../src/lib/brand.ts).

---

## Mission

> **Build the greatest digital arcade ever.**  
> **All games. All people. All the time.**

Short form (footer / lockups):

```
COINUP ARCADE  |  OUR MISSION: BUILD THE GREATEST DIGITAL ARCADE EVER.
                ALL GAMES. ALL PEOPLE. ALL THE TIME.
```

## Positioning

| | |
|--|--|
| **What** | Virtual arcade on Arch Network |
| **Currency** | Bitcoin (sats) — pay to play, win in BTC |
| **Tone** | Retro arcade floor, not DeFi dashboard |
| **Host** | Chip the Arcade Manager |

## Name & lockups

| Form | Use |
|------|-----|
| **CoinUp** | Product / company short name |
| **CoinUp Arcade** | Full product name |
| **COINUP** | Wordmark (often split: COIN + amber UP) |
| **COINUP ARCADE** | Cap, jacket, footer lockup |
| **COINUP ARCADE. FOREVER.** | Rally / forever line on game roster panels |

**Do not** call the product Archade.

### Jacket back copy

```
COINUP
ARCADE
INSERT COIN.
LEVEL UP.
```

### Manager badge

- Header: **ALL ACCESS**
- Face: Chip CRT (X / square eyes, flat mouth)
- Footer: **MANAGER**

---

## Taglines & voice

Primary play loop (product):

> **Insert Bitcoin. Play. Win Bitcoin.**

Arcade floor (Chip / cabinets):

> **Insert coin to continue.**  
> **Insert coin. Level up.**  
> **1UP starts here.**

Mission voice: bold, inclusive, permanent — *forever*, *all people*, *all the time*.  
Avoid: banking jargon, “yield,” “TVL,” sterile Web3 chrome.

Chip speaks in short arcade lines. He’s the manager, not a protocol abstract.

---

## Chip the Arcade Manager

| | |
|--|--|
| **Name** | Chip |
| **Role** | Arcade Manager (all-access) |
| **Form** | Pixel robot — CRT / arcade-monitor head, green phosphor face |
| **Fit** | Blue + gold varsity jacket, blue pants, blue/white sneakers |
| **Hat** | Blue/white trucker: **COINUP ARCADE** (yellow/orange wordmark) |
| **Accessories** | Side “INSERT COIN” panel, red bow, **ALL ACCESS** lanyard badge |

### CHIP.EXE // Expressions

Face plate moods for UI / copy (green on black CRT):

| Key | Label | Face vibe | When to use |
|-----|--------|-----------|-------------|
| `thinking` | THINKING… | X + square eyes, flat mouth | Loading, considering, “hmm” |
| `hyped` | HYPED | Upward chevron eyes | Wins, insert coin, launch |
| `determined` | DETERMINED | Inward chevrons | Game start, high stakes |
| `sleep` | ERROR 404: SLEEP | Flat dash eyes | Offline, night mode, empty state humor |

Default portrait expression matches **thinking** / neutral manager face.

### Chip’s gear (must-stay consistent)

- Back of jacket: **COINUP ARCADE** + **INSERT COIN. LEVEL UP.**
- Cap: trucker, white front panel, blue brim/back
- Badge: blue **ALL ACCESS** / **MANAGER** with mini Chip face
- Icon badges: yellow **C** mark · pink space invader · green **1UP**

### Day 1

Narrative beat on the board: Chip at a dirt lot with blueprints, excavator, city skyline — **DAY 1**.  
Use for origin / build-in-public storytelling. We’re constructing the arcade.

### Art rules

- Keep **pixel / CRT** aesthetic; don’t smooth Chip into 3D corporate mascot
- Scale with `image-rendering: pixelated` (or crisp-edges)
- Blue + gold/yellow is Chip’s uniform; don’t recolor the jacket casually

---

## Color system

Pulled from the concept board + Chip portrait. Prefer these over random neons.

### Core

| Token | Hex | Role |
|-------|-----|------|
| `void` | `#07050c` / near-black | Page background |
| `panel` | `#0c0a12` | Cards / panels |
| `ink` | `#f4f0ff` | Primary text |
| `muted` | `#71717a` | Secondary text |
| `gold` | `#fbbf24` / `#f59e0b` | COIN / coins / CTA heat |
| `varsity-blue` | `#1d4ed8` → `#2563eb` | Chip jacket, primary brand blue |
| `varsity-gold` | `#eab308` / `#facc15` | Jacket trim, stars, 1UP accents |
| `crt-green` | `#22c55e` / `#4ade80` | Chip face phosphor |
| `magenta` | `#f472b6` / `#ec4899` | Panel headers, forever line |
| `purple` | `#a78bfa` | Section frames (expressions panel) |

### Game accent colors (roster)

| Game | Accent vibe |
|------|-------------|
| Coin Drop | Orange / gold coins |
| Sat Hunter | Lime green + reticle |
| Pixel Racer | Blue + checkered flag |
| Rocket Run | Hot pink / magenta rocket |
| Orange Mines | Orange mine / grid |
| Memory Matrix | Cyan tiles |
| Block Stacker | Multi block (blue/purple/orange bars) |
| Lightning Reflex | Yellow bolt |

---

## Typography

| Use | Style |
|-----|--------|
| Titles / game names | Bold pixel-adjacent or tight mono; all-caps game titles on roster |
| UI chrome | Monospace (`Geist Mono` or system mono) |
| Body | Clean sans (`Geist`) — readable, not decorative |
| Mission bar | All-caps mono, letter-spaced |

Game title treatment on the board: **chunky all-caps**, each title in its own accent color.

---

## Official game roster

**COINUP ARCADE. FOREVER.** — announced lineup (+ more coming soon):

| ID (slug) | Title | Notes |
|-----------|--------|--------|
| `coin-drop` | **Coin Drop** | Coin cascade / catch energy |
| `sat-hunter` | **Sat Hunter** | Target / hunt sats |
| `pixel-racer` | **Pixel Racer** | Racing |
| `rocket-run` | **Rocket Run** | Vertical / runner rocket |
| `orange-mines` | **Orange Mines** | Minesweeper-class grid |
| `memory-matrix` | **Memory Matrix** | Memory match tiles |
| `block-stacker` | **Block Stacker** | Stack / tower skill |
| `lightning-reflex` | **Lightning Reflex** | Reaction timing |

Footer of roster: **AND MORE COMING SOON…**

When adding cabinets, **prefer these names** before inventing new ones. Prototype games in the repo should map onto this list (rename aliases rather than parallel branding).

---

## UI patterns

- Dark void backgrounds; neon accents sparingly
- Cabinet cards with per-game accent, not one global gradient soup
- **INSERT COIN** is a first-class CTA phrase
- Footer mission lockup when the full brand story is on screen
- Pixel art stays crisp; photos/concept boards can be photographic (Day 1 polaroid frame OK)

---

## Logo marks

| Mark | Description |
|------|-------------|
| **Wordmark** | COINUP (UP in gold) |
| **C badge** | Yellow coin-style **C** in a circle |
| **1UP** | Green badge |
| **Invader** | Pink classic invader silhouette |

---

## Do / Don’t

### Do

- Match Chip’s blue/gold varsity language
- Use official game titles from the roster
- Quote the mission for landing / about / social
- Keep satoshis as the unit of play money
- Reference Day 1 when telling the build story

### Don’t

- Rename to Archade or drop “Arcade” from the public product without a decision
- Replace Chip with a generic robot or human mascot
- Soften pixel art into glossy 3D without a deliberate art pass
- Lead with DeFi metrics instead of play
- Invent a second mascot that competes with Chip

---

## Asset index

| File | Role |
|------|------|
| `public/images/brand-guide-concept.jpg` | **Primary brand guide visual** (roster, expressions, gear, Day 1, mission) |
| `public/images/chip-arcade-manager.png` | Chip front hero / header mark |
| `docs/BRAND.md` | This written guide |
| `src/lib/brand.ts` | Tokens + roster for code |

When new brand art lands, add it here and prefer extending the concept board language over starting a second style.
