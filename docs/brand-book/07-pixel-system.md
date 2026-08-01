# 07 — Pixel System

> **CoinUp’s Material Design.**  
> If it is a pixel asset, it obeys this chapter. No exceptions without a versioned amendment.

The Pixel System makes every cabinet, Chip reaction, badge, emoji, and marquee feel like one universe — whether made by core team or community.

---

## 1. Purpose

Define non-negotiable craft law for:

- Character sprites & portraits  
- Icons, badges, achievements  
- Cabinet marquees & side art (pixel layers)  
- UI pixel ornaments  
- Social reaction images  
- Tournament stickers  

Vector/UI chrome (ch. 11) may be sharp and clean; **pixel art stays pixel art**.

---

## 2. Canonical canvas sizes

| Size | Use |
|------|-----|
| **16×16** | Favicon elements, micro icons, emoji-scale |
| **24×24** | Dense HUD icons |
| **32×32** | Default icon, small Chip face, inventory |
| **48×48** | Mid icons, achievement seeds |
| **64×64** | Standard character bust, item art |
| **128×128** | Hero pixel portraits, shareables base |
| **256×256** | Marketing pixel hero (still integer scale only) |

**Rule:** All canvases are **multiples of 8** preferred; official list above is mandatory for shipping assets.

### Scaling

- Display with **nearest neighbor** only (`image-rendering: pixelated` / `crisp-edges`)  
- Scale by **integer multiples**: 1×, 2×, 3×, 4×…  
- Forbidden: 1.5×, non-uniform stretch, bicubic “smooth”

---

## 3. The CoinUp 32 (canonical palette)

Work in progress v0 — **freeze to v1** when first full sprite sheet ships.  
All pixel assets must index into this table (names stable; hex locked at v1).

| # | Name | Hex | Role |
|---|------|-----|------|
| 0 | Void | `#07050C` | Background / transparent stand-in in sheets* |
| 1 | Panel | `#12101A` | Dark structure |
| 2 | Steel | `#2A2A35` | Metal, bezels |
| 3 | Mute | `#5C5C6B` | Secondary shade |
| 4 | Silver | `#A1A1AA` | Highlights cool |
| 5 | Ink | `#F4F0FF` | White-ish pixel |
| 6 | Varsity Blue Deep | `#1E3A8A` | Jacket shadow |
| 7 | Varsity Blue | `#2563EB` | Jacket main |
| 8 | Sky Blue | `#60A5FA` | Jacket light |
| 9 | CRT Dim | `#166534` | Phosphor shadow |
| 10 | CRT | `#22C55E` | Chip face main |
| 11 | CRT Hot | `#86EFAC` | Phosphor highlight |
| 12 | Gold Deep | `#A16207` | Coin shadow |
| 13 | Gold | `#EAB308` | Coin / trim |
| 14 | Gold Hot | `#FDE047` | Coin highlight |
| 15 | Amber | `#F59E0B` | Warm UI pixel |
| 16 | Orange | `#F97316` | Coin Drop / Crazy Wheel |
| 17 | Hot Orange | `#FB923C` | Accent |
| 18 | Magenta Deep | `#9D174D` | Shadow pink |
| 19 | Magenta | `#EC4899` | Rocket / forever |
| 20 | Pink Hot | `#F9A8D4` | Highlight pink |
| 21 | Purple Deep | `#5B21B6` | Block shadow |
| 22 | Purple | `#8B5CF6` | Block Stacker |
| 23 | Cyan Deep | `#0E7490` | Matrix shadow |
| 24 | Cyan | `#22D3EE` | Matrix / links |
| 25 | Red Deep | `#991B1B` | Danger shadow |
| 26 | Red | `#EF4444` | Danger / alerts |
| 27 | Brown | `#78350F` | Dirt Lot / wood |
| 28 | Tan | `#D6B48C` | Dirt / polaroid |
| 29 | Blueprint | `#1E3A5F` | Day 1 plans |
| 30 | Blueprint Line | `#38BDF8` | Plan strokes |
| 31 | Invader Pink | `#F472B6` | Invader mark |

\*True alpha allowed for **export masks** only; interior pixels still solid palette colors. No semi-transparent *shading* colors.

### Palette rules

1. **One pixel = one solid hex** from the 32  
2. **No anti-aliasing** against foreign colors  
3. **No blur filters**  
4. **No gradients** inside pixel art (dithering optional — see shading)  
5. **No “almost” hexes** (`#2563EC` is wrong if palette says `#2563EB`)  
6. Outline colors must also be in-palette  

---

## 4. Outlining

| Style | When |
|-------|------|
| **Single dark outline** | Characters, items on busy grounds |
| **Selective outline** | Only silhouette edge; drop internal outlines when readable |
| **No outline** | Tiles, seamless patterns |

Outline color: prefer **Steel / Panel / Void** — not pure random black outside palette.

---

## 5. Shading (allowed)

- **Cel steps:** 2–3 values per material (deep / mid / hot from same hue family)  
- **Pillow carefully:** avoid plastic spheres  
- **Hue shift:** shadow slightly cooler/deeper palette neighbor, not grey overlay  
- **Optional dither:** 50% checker only, same two palette colors, never noise blur  

### Forbidden shading

- Soft brush airbrush  
- Opacity stacks (e.g. black 20% multiply layers as final)  
- Outer glows as pixels unless composed of solid palette rings  
- Gaussian blur  
- Gradient meshes  

---

## 6. Lighting

Default key light: **upper-left** for characters (matches Chip hero read).  
Cabinet art may use marquee-top light.  
One light direction per scene unless lore says otherwise (e.g. dual CRT glow).

---

## 7. Animation rules

| Principle | Spec |
|-----------|------|
| Frame grid | Same canvas size every frame |
| Timing | 100–150ms default idle; snappier for hits (50–80ms) |
| Loop | Idle seamless; celebrate can one-shot |
| Onion | Align pivot (e.g. feet) across frames |
| Smear | Optional 1-frame solid palette smear; no blur |

### Standard Chip cycles (targets)

| Cycle | Frames (guide) | Notes |
|-------|----------------|-------|
| Idle | 2–4 | Phosphor blink |
| Blink | 1–2 | Mouth/eyes |
| Jump | 3–5 | |
| Celebrate | 6–12 | Hyped face |
| Lose | 4–6 | Sleep / tilt |

---

## 8. Asset categories

### Icons

- 32×32 base  
- Readable at 16×16  
- Fill mostly inside 28×28 safe  

### Sprites

- Character: keep feet/contact consistent  
- Separate layers in source: body / face / gear  

### Emoji / reactions

- Chip expressions at 128×128 master → 64/32 exports  
- Label optionally under in social packs, not baked into sprite  

### Cabinet marquees

- Pixel type may be hand-placed  
- Accent from game color within palette  

### Character sheets

- Front / back / side / ¾ on one 128+ sheet with labeled cells  
- Transparent void between cells  

---

## 9. Export pipeline

1. Author at 1× native size in indexed or locked palette  
2. Export PNG, no color profile weirdness  
3. Verify palette with script/checklist  
4. Ship 1× + optional 2×/4× integer scales only  
5. CSS: `.pixelated { image-rendering: pixelated; }`  

### PR checklist (pixel assets)

- [ ] Size on approved list  
- [ ] Only CoinUp 32 colors  
- [ ] No AA / blur / gradient  
- [ ] Nearest-neighbor preview looks correct  
- [ ] Named `chip_*` / `icon_*` / `cabinet_*` consistently  

---

## 10. Relationship to vector UI

| Pixel System | UI System (ch. 11) |
|--------------|-------------------|
| Sprites, icons pixel, Chip | Buttons, layout, type |
| 32 palette | Brand ramps OK |
| Nearest neighbor | Standard text AA OK |

Do not draw Chip in smooth vector gradients and call it “pixel adjacent.”

---

## 11. Amendments

Palette or size changes require:

1. Note in this chapter changelog  
2. Migration plan for existing assets  
3. Bump Pixel System version (`PS-v0` → `PS-v1`)  

### Pixel System changelog

| Ver | Notes |
|-----|--------|
| PS-v0 | Initial 32, sizes, rules — living freeze candidate |
| PS-v0.1 | Aligned checklist to Brand Book v1 panel 11 |

---

## 12. Brand Book v1 checklist (panel 11)

**Grid sizes:** 16×16 · 32×32 · 64×64 · 128×128 (also 24 / 48 per system above)

| DO | DON'T |
|----|--------|
| One pixel = one solid hex color | Partial pixels |
| No anti-aliasing | Transparency tricks for shading |
| No gradients | Soft shadows |
| No blur / glow on sprites | Outer glow filters |
| Crisp pixel edges | Random filters |

Coin C icons at each grid size are the reference masters for scale readability.
