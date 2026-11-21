import glob
from PIL import Image

for f in glob.glob('ai-finance-platform-main/.next/cache/images/*/*.webp'):
    try:
        im = Image.open(f)
        print(f, im.size, im.format)
    except Exception as e:
        print(f, e)
