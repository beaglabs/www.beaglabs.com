"""Static version of the homepage's orange/white dot grid, for email clients."""
from PIL import Image, ImageDraw
from pathlib import Path
import math
image = Image.new('RGB', (1280, 320), '#000000')
draw = ImageDraw.Draw(image)
colors = ['#ff5f1f', '#ff8a5c', '#ffb894', '#ffffff', '#ffc9b0']
for row, y in enumerate(range(16, 320, 36)):
    for col, x in enumerate(range(16, 1280, 36)):
        n = (col * 17 + row * 31) % 13
        r = 8 + 7 * (0.5 + 0.5 * math.sin(col * .38 + row * .62))
        draw.ellipse((x-r, y-r, x+r, y+r), fill=colors[n % len(colors)])
image.save(Path(__file__).resolve().parents[1] / 'workers/control-plane/public/assets/credit-dots.png', optimize=True)
