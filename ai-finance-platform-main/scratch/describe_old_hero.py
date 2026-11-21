import os
from PIL import Image
import numpy as np

hero = Image.open('ai-finance-platform-main/public/hero-banner.jpg')
arr = np.array(hero)
print("Old hero size:", hero.size)
# Check dominant colors
# Let's see some mean colors across sections
print("Top 100 rows mean:", arr[:100, :, :].mean(axis=(0, 1)))
print("Middle rows mean:", arr[250:350, :, :].mean(axis=(0, 1)))
print("Bottom 100 rows mean:", arr[-100:, :, :].mean(axis=(0, 1)))
