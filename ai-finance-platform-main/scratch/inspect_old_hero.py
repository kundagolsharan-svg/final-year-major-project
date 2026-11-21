import os
from PIL import Image

hero = Image.open('ai-finance-platform-main/public/hero-banner.jpg')
print('Hero size:', hero.size)
# Save a small copy or inspect
hero.thumbnail((400, 300))
hero.save('ai-finance-platform-main/scratch/hero_thumb.jpg')
print('Saved hero thumbnail')
