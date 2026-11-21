import os
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
import numpy as np

orig = Image.open(r'C:/Users/shara/.gemini/antigravity/brain/32b1ead9-3bf8-4fac-a382-2f89a8b3456c/.user_uploaded/media_1795230959941_f4d8ac78.jpg')

# Crop the card
# y from 416 to 653, x from 74 to 386
card = orig.crop((74, 416, 386, 653))

# Target 4K resolution: 3840 x 2160 or 2560 x 1440
target_w = 2560
target_h = int(card.height * (target_w / card.width))

# Multi-stage progressive upscaling with intermediate edge sharpening
def progressive_upscale(img, target_w, target_h):
    w, h = img.size
    cur = img
    while w < target_w:
        next_w = min(int(w * 1.5), target_w)
        next_h = min(int(h * 1.5), target_h)
        cur = cur.resize((next_w, next_h), Image.Resampling.LANCZOS)
        
        # Subtle de-ringing & edge enhancement at each step
        cur = cur.filter(ImageFilter.UnsharpMask(radius=1.2, percent=80, threshold=2))
        w, h = cur.size
    
    # Final sharpening
    final = cur.filter(ImageFilter.UnsharpMask(radius=2.0, percent=120, threshold=1))
    
    # Contrast & Color Pop
    enhancer = ImageEnhance.Contrast(final)
    final = enhancer.enhance(1.12)
    color = ImageEnhance.Color(final)
    final = color.enhance(1.08)
    
    return final

ultra = progressive_upscale(card, target_w, target_h)
ultra.save('ai-finance-platform-main/scratch/ultra_sharp_hero.jpg', quality=98)
print("Ultra sharp image created:", ultra.size)
