#!/usr/bin/env python3
"""Draws the app icons (a lit storm lantern) into public/icons.

Run once, or again after changing the design:  python3 scripts/make-icons.py
Needs Pillow. The PNGs it writes are committed, so playing or building the
game does not need Python.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
INK = (10, 18, 22)
BRASS = (201, 162, 76)
BRASS_DARK = (118, 90, 38)
LAMP = (255, 180, 94)
FLAME = (255, 243, 208)


def lantern(size, scale=1.0):
    """One icon, drawn four times too large and reduced, for clean edges."""
    S = 1024
    img = Image.new("RGB", (S, S), INK)

    # The light it throws.
    glow = Image.new("L", (S, S), 0)
    g = ImageDraw.Draw(glow)
    cx, cy = S // 2, int(S * 0.53)
    for i in range(60, 0, -1):
        r = int(470 * scale * i / 60)
        g.ellipse([cx - r, cy - r, cx + r, cy + r], fill=int(150 * (1 - i / 60) ** 1.6))
    img.paste(Image.new("RGB", (S, S), LAMP), (0, 0), glow)

    art = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(art)

    def P(x, y):
        return (cx + (x - 512) * scale, S / 2 + (y - 512) * scale)

    def poly(points, fill):
        d.polygon([P(x, y) for x, y in points], fill=fill)

    def ell(x0, y0, x1, y1, **kw):
        d.ellipse([P(x0, y0), P(x1, y1)], **kw)

    w = max(4, int(20 * scale))
    # Carrying ring.
    ell(442, 150, 582, 290, outline=BRASS, width=w)
    # Cap and chimney.
    poly([(470, 268), (554, 268), (566, 312), (458, 312)], BRASS_DARK)
    poly([(420, 312), (604, 312), (636, 372), (388, 372)], BRASS)
    # Glass, lit from inside.
    ell(372, 352, 652, 712, fill=(255, 205, 130))
    ell(412, 400, 612, 690, fill=(255, 226, 170))
    # Flame.
    poly([(512, 440), (556, 560), (512, 640), (468, 560)], FLAME)
    ell(468, 520, 556, 640, fill=FLAME)
    # Guard wires.
    for x in (372, 652):
        d.line([P(x, 372), P(x, 700)], fill=BRASS_DARK, width=w)
    d.line([P(372, 532), P(652, 532)], fill=BRASS_DARK, width=max(3, int(12 * scale)))
    # Font and foot.
    poly([(388, 690), (636, 690), (668, 790), (356, 790)], BRASS)
    poly([(340, 790), (684, 790), (684, 836), (340, 836)], BRASS_DARK)

    img.paste(art, (0, 0), art)
    return img.filter(ImageFilter.GaussianBlur(0.6)).resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    lantern(512).save(OUT / "icon-512.png", optimize=True)
    lantern(192).save(OUT / "icon-192.png", optimize=True)
    lantern(180).save(OUT / "apple-touch-icon.png", optimize=True)
    lantern(32).save(OUT / "favicon-32.png", optimize=True)
    # Maskable icons get cropped to a circle or squircle: keep the art inside the safe middle.
    lantern(512, scale=0.72).save(OUT / "icon-maskable-512.png", optimize=True)
    for f in sorted(OUT.glob("*.png")):
        print(f"{f.name}  {f.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
