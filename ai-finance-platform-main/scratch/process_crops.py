from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

orig = Image.open(r'C:/Users/shara/.gemini/antigravity/brain/32b1ead9-3bf8-4fac-a382-2f89a8b3456c/.user_uploaded/media_1795230959941_f4d8ac78.jpg')

# Option 1: Exact inner landing page UI
# (left=94, top=436, right=366, bottom=632)
inner = orig.crop((94, 436, 366, 632))

# Option 2: Full card with soft purple ambient border
# (left=76, top=418, right=384, bottom=651)
full_card = orig.crop((76, 418, 384, 651))

def upscale_clean(img, target_w=1920):
    aspect = img.height / img.width
    target_h = int(target_w * aspect)
    # High-quality 2-step Lanczos upscale
    mid = img.resize((target_w // 2, target_h // 2), Image.Resampling.LANCZOS)
    mid = mid.filter(ImageFilter.UnsharpMask(radius=1.2, percent=100, threshold=2))
    
    final = mid.resize((target_w, target_h), Image.Resampling.LANCZOS)
    final = final.filter(ImageFilter.UnsharpMask(radius=1.5, percent=110, threshold=3))
    
    # Slight color/contrast enhancement to make dark mode pop
    enhancer = ImageEnhance.Contrast(final)
    final = enhancer.enhance(1.08)
    color = ImageEnhance.Color(final)
    final = color.enhance(1.05)
    return final

inner_hd = upscale_clean(inner, 1920)
card_hd = upscale_clean(full_card, 1920)

inner_hd.save('ai-finance-platform-main/scratch/inner_clean_1920.jpg', quality=95)
card_hd.save('ai-finance-platform-main/scratch/card_clean_1920.jpg', quality=95)
print("Saved inner_clean_1920:", inner_hd.size)
print("Saved card_clean_1920:", card_hd.size)
