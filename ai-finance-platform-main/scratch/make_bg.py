import os
from PIL import Image, ImageFilter, ImageEnhance

orig = Image.open(r'C:/Users/shara/.gemini/antigravity/brain/32b1ead9-3bf8-4fac-a382-2f89a8b3456c/.user_uploaded/media_1795230959941_f4d8ac78.jpg')

# The card in the screenshot (including the blue vertical beam and surrounding glow)
# y from 416 to 654, x from 74 to 386
card = orig.crop((74, 416, 386, 654))

# Create 1920x1080 background
bg_w, bg_h = 1920, 1080
bg = Image.new('RGB', (bg_w, bg_h), (9, 8, 20)) # Dark navy purple from the shot

# Resize card to fit nicely in 1920x1080 (cover or contained with beautiful glow)
# If scaled to fill 1920 width:
card_w = 1920
card_h = int(card.height * (1920 / card.width))
card_resized = card.resize((card_w, card_h), Image.Resampling.LANCZOS)
card_resized = card_resized.filter(ImageFilter.UnsharpMask(radius=1.8, percent=120, threshold=2))

# Enhance colors and contrast
enhancer = ImageEnhance.Contrast(card_resized)
card_resized = enhancer.enhance(1.08)
color_enhancer = ImageEnhance.Color(card_resized)
card_resized = color_enhancer.enhance(1.1)

# Save high-res background
card_resized.save('ai-finance-platform-main/public/images/landing-hero-bg.jpg', quality=95)

# Also save 1920x1080 exact version
exact_1080 = card.resize((1920, 1080), Image.Resampling.LANCZOS)
exact_1080 = exact_1080.filter(ImageFilter.UnsharpMask(radius=1.8, percent=120, threshold=2))
exact_1080.save('ai-finance-platform-main/public/images/landing-hero-bg-1080.jpg', quality=95)

# Also replace cyberpunk-hero.jpg and hero-banner.jpg with this new high-def image
card_resized.save('ai-finance-platform-main/public/images/cyberpunk-hero.jpg', quality=95)
card_resized.save('ai-finance-platform-main/public/hero-banner.jpg', quality=95)

print("Generated landing-hero-bg.jpg:", card_resized.size)
