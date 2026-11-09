"""Mechanically isolate 2026 PKM-PM road-condition traces from the supplied map.

The map is a rendered cartographic figure, not authoritative surveyed vector
geometry. Coordinates inferred from the graticule are approximations and the
resulting overlay must never be used for turn-by-turn evacuation routing.
"""

from pathlib import Path
import json

import numpy as np
from PIL import Image
from scipy import ndimage as ndi


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "dist/assets/maps/kajian-jalur-sumberwuluh-jarit-2026.png"
OUTPUT = ROOT / "dist/assets/maps/koridor-jalan-terekstraksi-2026.png"
META = ROOT / "dist/assets/maps/koridor-jalan-bounds-2026.json"

# RGB values sampled from the diagram's road-network lines (not from photos).
PALETTES = {
    "baik": ((56, 168, 0), (38, 162, 75)),
    "kurang_baik": ((168, 112, 0), (205, 135, 37)),
}

# Reference graticule: 113°00'E at x=248 and 8°10'S at y=246.
# Intervals are approximately 114.5 raster pixels per 30 arcseconds.
ANCHOR_X, ANCHOR_Y = 248, 246
PX_PER_HALF_MIN = 114.5


def pixel_to_coordinates(x: float, y: float) -> tuple[float, float]:
    lng = 113.0 + (x - ANCHOR_X) / PX_PER_HALF_MIN / 120
    lat = -(8 + 10 / 60) - (y - ANCHOR_Y) / PX_PER_HALF_MIN / 120
    return lat, lng


def main() -> None:
    raw = np.asarray(Image.open(SOURCE).convert("RGB"), dtype=np.int16)
    height, width, _ = raw.shape
    plot = np.zeros((height, width), dtype=bool)
    plot[40:1095, 40:2010] = True  # exclude scale, legends, title and margins

    masks = {}
    for key, (source_rgb, _) in PALETTES.items():
        nearby = np.max(np.abs(raw - np.array(source_rgb, dtype=np.int16)), axis=2) < 21
        nearby &= plot
        components, total = ndi.label(nearby, structure=np.ones((3, 3), dtype=bool))
        counts = np.bincount(components.ravel())
        keep = counts >= 35  # remove tiny isolated compression artifacts
        keep[0] = False
        mask = keep[components]
        # A few orange pixels in the photograph callouts are not mapped roads.
        if key == "kurang_baik":
            mask[:400, 1200:] = False
        masks[key] = mask
        print(f"{key}: {int(mask.sum())} source pixels in {total} candidate components")

    network = np.logical_or.reduce(list(masks.values()))
    ys, xs = np.where(network)
    if not len(xs):
        raise RuntimeError("No colored road traces detected; map source may have changed")
    left, right = max(0, int(xs.min()) - 10), min(width, int(xs.max()) + 11)
    top, bottom = max(0, int(ys.min()) - 10), min(height, int(ys.max()) + 11)

    canvas = np.zeros((bottom - top, right - left, 4), dtype=np.uint8)
    local = {key: value[top:bottom, left:right] for key, value in masks.items()}
    combined = np.logical_or.reduce(list(local.values()))
    halo = ndi.binary_dilation(combined, iterations=4)
    canvas[halo, :3] = (252, 250, 233)
    canvas[halo, 3] = 220
    for key, (_, visible_rgb) in PALETTES.items():
        thick = ndi.binary_dilation(local[key], iterations=1)
        canvas[thick, :3] = visible_rgb
        canvas[thick, 3] = 255

    Image.fromarray(canvas, "RGBA").save(OUTPUT, optimize=True)
    northwest = pixel_to_coordinates(left, top)
    southeast = pixel_to_coordinates(right, bottom)
    metadata = {
        "bounds": [[southeast[0], northwest[1]], [northwest[0], southeast[1]]],
        "source": "PKM-PM Sister Village Team, map figure 2026",
        "accuracy": "approximate image-graticule registration; not GPS or routing geometry",
        "method": "RGB isolation and component filtering of green/orange road markings",
        "source_pixel_crop": [left, top, right, bottom],
    }
    META.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print("Overlay:", OUTPUT)
    print("Bounds:", metadata["bounds"])


if __name__ == "__main__":
    main()
