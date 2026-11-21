from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

# Load original uploaded image
orig = Image.open(r'C:/Users/shara/.gemini/antigravity/brain/32b1ead9-3bf8-4fac-a382-2f89a8b3456c/.user_uploaded/media_1795230959941_f4d8ac78.jpg')

# 1. Inner crop (just the landing page UI):
# left=94, top=436, right=366, bottom=632
inner_crop = orig.crop((94, 436, 366, 632))

# 2. Card crop (the whole presentation card):
# left=76, top=418, right=384, bottom=651
card_crop = orig.crop((76, 418, 384, 651))

def process_and_optimize(img, width=1920):
    aspect = img.height / img.width
    height = int(width * aspect)
    
    # Resize with high quality Lanczos
    res = img.resize((width, height), Image.Resampling.LANCZOS)
    
    # Mild median filter to reduce JPEG macroblock artifacts
    # then unsharp mask to restore edge crispness
    smooth = res.filter(ImageFilter.MedianFilter(size=3))
    
    # Blend smoothed and sharp to keep details while removing noise
    blended = Image.blend(res, smooth, 0.25)
    
    # Sharpen edges
    sharpened = blended.filter(ImageFilter.UnsharpMask(radius=1.8, percent=130, threshold=2))
    
    # Rich contrast for dark fintech UI
    enhancer = ImageEnhance.Contrast(sharpened)
    enhanced = enhancer.enhance(1.06)
    
    color_enhancer = ImageEnhance.Color(enhanced)
    final = color_enhancer.enhance(1.05)
    return final

inner_final = process_and_optimize(inner_crop, 1920)
card_final = process_and_optimize(card_crop, 1920)

inner_final.save('ai-finance-platform-main/scratch/hero_inner_final.jpg', quality=96)
card_final.save('ai-finance-platform-main/scratch/hero_card_final.jpg', quality=96)

print("inner_final size:", inner_final.size)
print("card_final size:", card_final.size)
