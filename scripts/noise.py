"""Write the film-grain tile used by <Grain /> to public/textures/noise.png."""
from pathlib import Path

import numpy as np
from PIL import Image

out = Path(__file__).resolve().parent.parent / "public" / "textures" / "noise.png"
out.parent.mkdir(parents=True, exist_ok=True)
n = np.clip(np.random.default_rng(7).normal(0.5, 0.18, (512, 512)), 0, 1)
Image.fromarray((n * 255).astype(np.uint8), "L").save(out)
