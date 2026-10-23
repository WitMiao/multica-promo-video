"""Subset the CJK variable fonts to the glyphs the film actually uses.

Scans every .ts/.tsx/.json under src/ for non-ASCII characters, adds printable ASCII
and common CJK punctuation, and writes woff2 subsets (variable axes kept) to
public/fonts/. Re-run after changing on-screen copy.

    audio/.venv/bin/python scripts/subset-fonts.py
"""

from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
CACHE = ROOT / ".cache" / "fonts"
OUT = ROOT / "public" / "fonts"

chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set("，。、！？：；“”‘’（）《》【】—…·「」『』～％＋－×÷→←↑↓✓✗•")
for path in [*SRC.rglob("*.ts*"), *SRC.rglob("*.json")]:
    text = path.read_text(encoding="utf-8")
    chars |= {ch for ch in text if ord(ch) > 0x7F}

text = "".join(sorted(chars))
print(f"{len(chars)} unique characters")

for name in ("NotoSerifSC", "NotoSansSC"):
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    font = subset.load_font(str(CACHE / f"{name}-VF.ttf"), options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    out = OUT / f"{name}.woff2"
    subset.save_font(font, str(out), options)
    print(f"{out.name}: {out.stat().st_size / 1024:.0f} KiB")
