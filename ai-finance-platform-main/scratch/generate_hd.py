import os
from PIL import Image, ImageEnhance, ImageFilter

orig = Image.open(r'C:/Users/shara/.gemini/antigravity/brain/32b1ead9-3bf8-4fac-a382-2f89a8b3456c/.user_uploaded/media_1795230959941_f4d8ac78.jpg')

# Let's inspect exact pixel bounds of the presentation card:
# The presentation card is the main content of the Dribbble shot.
# Left: 76, Top: 418, Right: 384, Bottom: 651
# Size: 308 x 233

# Let's also check if there is an inner frame:
# Inner frame: Left: 93, Top: 435, Right: 367, Bottom: 634
# Size: 274 x 199

card = orig.crop((76, 418, 384, 651))
inner = orig.crop((93, 435, 367, 634))

# Let's upscale both to 1280x720 or 1024x682 (standard hero banner sizes)
# We can use Lanczos resampling + subtle unsharp mask for crispness
card_hd = card.resize((1280, int(1280 * card.height / card.width)), Image.Resampling.LANCZOS)
card_hd = card_hd.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))

inner_hd = inner.resize((1280, int(1280 * inner.height / inner.width)), Image.Resampling.LANCZOS)
inner_hd = inner_hd.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))

card_hd.save('ai-finance-platform-main/scratch/card_hd.jpg', quality=95)
inner_hd.save('ai-finance-platform-main/scratch/inner_hd.jpg', quality=95)
print("card_hd size:", card_hd.size)
print("inner_hd size:", inner_hd.size)
