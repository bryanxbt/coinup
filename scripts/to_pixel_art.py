#!/usr/bin/env python3
"""
Convert an image to true CoinUp Pixel System art:
  - integer grid (native_size × native_size)
  - every pixel is exactly one palette hex (or hard transparent)
  - nearest-neighbor upscale for display

Usage:
  python scripts/to_pixel_art.py [input] [output_dir]
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

# CoinUp 32 + Brand Book v1 primaries (must stay solid hex only)
PALETTE_HEX = [
    # Pixel System 32
    "#07050C",
    "#12101A",
    "#2A2A35",
    "#5C5C6B",
    "#A1A1AA",
    "#F4F0FF",
    "#1E3A8A",
    "#2563EB",
    "#60A5FA",
    "#166534",
    "#22C55E",
    "#86EFAC",
    "#A16207",
    "#EAB308",
    "#FDE047",
    "#F59E0B",
    "#F97316",
    "#FB923C",
    "#9D174D",
    "#EC4899",
    "#F9A8D4",
    "#5B21B6",
    "#8B5CF6",
    "#0E7490",
    "#22D3EE",
    "#991B1B",
    "#EF4444",
    "#78350F",
    "#D6B48C",
    "#1E3A5F",
    "#38BDF8",
    "#F472B6",
    # Brand Book v1 locks
    "#000012",
    "#14141A",
    "#1C1C24",
    "#2A2A33",
    "#3A3A44",
    "#FCC76E",
    "#FF5A00",
    "#2962FF",
    "#FF4EC7",
    "#00DE76",
    "#736FB9",
    "#3E3ABE",
    "#FFFFFF",
    "#FFE680",
    "#FFB347",
    "#00D0FF",
    "#FF3B3B",
    "#FFD11A",
    "#BAFF00",
    "#FF8B6F",
    # Cream bezel / hat front common in Chip art
    "#F5F0E1",
    "#E8E0D0",
    "#C4B8A0",
]


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


PALETTE = [hex_to_rgb(h) for h in PALETTE_HEX]
VOID = hex_to_rgb("#000012")


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


def to_pixel_art(
    src: Path,
    native_size: int = 128,
    display_scale: int = 8,
    hard_alpha: bool = False,
    alpha_threshold: int = 40,
) -> tuple[Image.Image, Image.Image]:
    im = Image.open(src).convert("RGBA")

    # BOX downsample = true pixel buckets (averages block → then we snap to palette)
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
            # dark near-void background → solid void (or transparent)
            if luminance((r, g, b)) < 18 and a > 200:
                if hard_alpha:
                    op[x, y] = (0, 0, 0, 0)
                else:
                    op[x, y] = (*VOID, 255)
                continue
            nr, ng, nb = nearest((r, g, b))
            op[x, y] = (nr, ng, nb, 255)

    # Nearest-neighbor display upscale only
    display = out.resize(
        (native_size * display_scale, native_size * display_scale),
        Image.Resampling.NEAREST,
    )
    return out, display


def assert_palette_only(im: Image.Image) -> int:
    """Return unique solid colors; raise if any off-palette RGB."""
    allowed = set(PALETTE) | {VOID}
    im = im.convert("RGBA")
    colors = im.getcolors(maxcolors=im.size[0] * im.size[1])
    assert colors is not None
    bad = []
    solids = set()
    for _count, (r, g, b, a) in colors:
        if a == 0:
            continue
        if a != 255:
            bad.append((r, g, b, a))
            continue
        if (r, g, b) not in allowed:
            # allow exact palette only
            bad.append((r, g, b, a))
        else:
            solids.add((r, g, b))
    if bad:
        raise SystemExit(f"Off-palette or soft-alpha pixels: {bad[:20]}… ({len(bad)} total)")
    return len(solids)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "public/images/chip-arcade-manager.png"
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else root / "public/images"

    # Preserve original once
    backup = out_dir / "chip-arcade-manager-original.png"
    if src.exists() and not backup.exists():
        Image.open(src).save(backup)
        print(f"backed up original → {backup.name}")

    source = src if src.exists() else backup

    # Hero master: 256×256 solid-hex grid
    native, display = to_pixel_art(
        source,
        native_size=256,
        display_scale=4,
        hard_alpha=False,
    )
    n_colors = assert_palette_only(native)
    print(f"native 256×256 unique solid colors: {n_colors}")

    native.save(out_dir / "chip-arcade-manager-256.png")
    display.save(out_dir / "chip-arcade-manager.png")

    native_t, display_t = to_pixel_art(
        source,
        native_size=256,
        display_scale=4,
        hard_alpha=True,
    )
    assert_palette_only(native_t)
    native_t.save(out_dir / "chip-arcade-manager-256-transparent.png")
    display_t.save(out_dir / "chip-arcade-manager-transparent.png")

    # Derived masters via nearest only (no re-blur)
    for size in (128, 64, 32):
        s = native.resize((size, size), Image.Resampling.NEAREST)
        s.save(out_dir / f"chip-arcade-manager-{size}.png")
        st = native_t.resize((size, size), Image.Resampling.NEAREST)
        st.save(out_dir / f"chip-arcade-manager-{size}-transparent.png")

    print("wrote chip-arcade-manager-256.png (grid master)")
    print(f"wrote chip-arcade-manager.png (4× nearest display, {display.size[0]}px)")
    print("wrote 128/64/32 masters + transparent variants")


if __name__ == "__main__":
    main()
