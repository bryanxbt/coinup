#!/usr/bin/env python3
"""
Jack the Dealer → true pixel art.

Every solid pixel is exactly one hex from the Card Room brand book
(panel 08) plus a small locked support set for skin / wood / cloth
documented below. Soft alpha is forbidden (0 or 255 only).

Usage:
  python scripts/to_pixel_art_jack.py [reference.jpg] [out_dir]
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

# ── Brand book panel 08 (locked) ─────────────────────────────────────
PANEL_08 = [
    "#0E2B1E",  # emerald deep
    "#1F4D33",  # emerald felt
    "#BFA64A",  # brass
    "#E8D9A6",  # ivory
    "#1A1A18",  # near black
    "#F4C542",  # gold bright
    "#22C55E",  # success
    "#F6686B",  # danger
    "#4B1E16",  # burgundy
    "#0B0C0F",  # void
]

# ── Jack / room support (locked for this character only) ─────────────
# Explicit hexes so skin, wood, and shirt read without leaving brand feel.
SUPPORT = [
    "#000000",  # pure black outline
    "#2A1F14",  # walnut (CSS --cr-walnut)
    "#3D2A1A",  # wood mid
    "#5C4A14",  # brass shadow
    "#8A7429",  # gold dim (--cr-gold-dim)
    "#C4A574",  # skin highlight
    "#A67C52",  # skin mid
    "#7A5638",  # skin shadow
    "#5C3D28",  # skin deep
    "#F5F0E1",  # shirt light
    "#C8BFA8",  # shirt mid
    "#166534",  # vest shadow / CRT dim
    "#0A1F14",  # felt dark
    "#14532D",  # green deep
    "#991B1B",  # chip red deep
    "#B91C1C",  # chip red
    "#78350F",  # chip brown
    "#FFFFFF",  # pure white pin
]

PALETTE_HEX = PANEL_08 + SUPPORT


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


PALETTE = [hex_to_rgb(h) for h in PALETTE_HEX]
VOID = hex_to_rgb("#0B0C0F")


def nearest(rgb: tuple[int, int, int]) -> tuple[int, int, int]:
    r, g, b = rgb
    best = PALETTE[0]
    best_d = 1e18
    for pr, pg, pb in PALETTE:
        d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
        if d < best_d:
            best_d = d
            best = (pr, pg, pb)
    return best


def luminance(rgb: tuple[int, int, int]) -> float:
    r, g, b = rgb
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def to_pixel(
    im: Image.Image,
    native_size: int,
    hard_alpha: bool = True,
    alpha_threshold: int = 28,
    void_lum: float = 14.0,
) -> Image.Image:
    """BOX downsample → snap every pixel to palette. Alpha is 0 or 255 only."""
    im = im.convert("RGBA")
    small = im.resize((native_size, native_size), Image.Resampling.BOX)
    px = small.load()
    assert px is not None
    out = Image.new("RGBA", (native_size, native_size), (0, 0, 0, 0))
    op = out.load()
    assert op is not None

    for y in range(native_size):
        for x in range(native_size):
            r, g, b, a = px[x, y]
            if a < alpha_threshold:
                op[x, y] = (0, 0, 0, 0) if hard_alpha else (*VOID, 255)
                continue
            if luminance((r, g, b)) < void_lum:
                if hard_alpha:
                    # keep pure black as outline if slightly above void
                    if luminance((r, g, b)) < 6:
                        op[x, y] = (0, 0, 0, 255)
                    else:
                        op[x, y] = (0, 0, 0, 0)
                else:
                    op[x, y] = (*VOID, 255)
                continue
            nr, ng, nb = nearest((r, g, b))
            op[x, y] = (nr, ng, nb, 255)
    return out


def assert_palette_only(im: Image.Image) -> int:
    allowed = set(PALETTE)
    im = im.convert("RGBA")
    colors = im.getcolors(maxcolors=im.size[0] * im.size[1])
    assert colors is not None
    bad: list[tuple] = []
    solids: set[tuple[int, int, int]] = set()
    for _count, (r, g, b, a) in colors:
        if a == 0:
            continue
        if a != 255:
            bad.append((r, g, b, a))
            continue
        if (r, g, b) not in allowed:
            bad.append((r, g, b, a))
        else:
            solids.add((r, g, b))
    if bad:
        raise SystemExit(
            f"Off-palette or soft-alpha: {bad[:15]}… ({len(bad)} kinds)"
        )
    return len(solids)


def nn(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.Resampling.NEAREST)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    src = (
        Path(sys.argv[1])
        if len(sys.argv) > 1
        else root / "tmp" / "jack-reference.jpg"
    )
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else root / "public" / "images"
    out_dir.mkdir(parents=True, exist_ok=True)

    if not src.exists():
        raise SystemExit(f"Missing reference: {src}")

    raw = Image.open(src).convert("RGBA")
    # Save locked reference next to outputs
    ref_out = out_dir / "jack-the-dealer-reference.jpg"
    if src.suffix.lower() in {".jpg", ".jpeg"}:
        Image.open(src).convert("RGB").save(ref_out, quality=92)
    else:
        raw.convert("RGB").save(ref_out, quality=92)

    # Master grid: 128 native (hero bust reads well)
    native128 = to_pixel(raw, 128, hard_alpha=True)
    n = assert_palette_only(native128)
    print(f"128×128 unique solid colors: {n}")

    native256 = to_pixel(raw, 256, hard_alpha=True)
    assert_palette_only(native256)
    print(f"256×256 unique solid colors: {assert_palette_only(native256)}")

    # Solid void background variants (for dark UI frames)
    void128 = to_pixel(raw, 128, hard_alpha=False)
    assert_palette_only(void128)

    # Write masters — nearest only for derived sizes
    native256.save(out_dir / "jack-the-dealer-256.png")
    native128.save(out_dir / "jack-the-dealer-128.png")
    nn(native256, 512).save(out_dir / "jack-the-dealer-512.png")
    nn(native256, 1024).save(out_dir / "jack-the-dealer.png")
    nn(native128, 64).save(out_dir / "jack-the-dealer-64.png")
    nn(native128, 32).save(out_dir / "jack-the-dealer-32.png")

    # Transparent aliases under card-room/
    cr = out_dir / "card-room"
    cr.mkdir(exist_ok=True)
    native256.save(cr / "jack-256.png")
    native128.save(cr / "jack-128.png")
    nn(native128, 64).save(cr / "jack-64.png")

    # Display 4× of 128 for QA
    qa = root / "tmp" / "jack-pixel-qa-512.png"
    nn(native128, 512).save(qa)
    print(f"wrote {out_dir}/jack-the-dealer-{{32,64,128,256,512}}.png + master")
    print(f"QA preview → {qa}")
    print("palette = panel 08 + Jack support (see script header)")


if __name__ == "__main__":
    main()
