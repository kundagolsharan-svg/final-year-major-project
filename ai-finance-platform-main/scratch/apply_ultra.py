import shutil
from PIL import Image, ImageFilter

gen_path = r'C:\Users\shara\.gemini\antigravity\brain\32b1ead9-3bf8-4fac-a382-2f89a8b3456c\finsight_hero_graphic_v2_1795241040588.jpg'
gen = Image.open(gen_path)

# 2560x1440 QHD / 4K upscale of generated image
gen_2k = gen.resize((2560, 1429), Image.Resampling.LANCZOS)
gen_2k = gen_2k.filter(ImageFilter.UnsharpMask(radius=1.5, percent=110, threshold=2))
gen_2k.save('ai-finance-platform-main/public/images/landing-hero-bg-ai.jpg', quality=98)

# Ultra sharp direct crop
ultra = Image.open('ai-finance-platform-main/scratch/ultra_sharp_hero.jpg')
ultra_2k = ultra.resize((2560, int(2560 * ultra.height / ultra.width)), Image.Resampling.LANCZOS)
ultra_2k = ultra_2k.filter(ImageFilter.UnsharpMask(radius=1.5, percent=110, threshold=2))
ultra_2k.save('ai-finance-platform-main/public/images/landing-hero-bg-direct.jpg', quality=98)

# Update landing-hero-bg.jpg with the ultra crystal clear version
# Let's save the highest resolution generated AI artwork as landing-hero-bg.jpg and hero-banner.jpg
gen_2k.save('ai-finance-platform-main/public/images/landing-hero-bg.jpg', quality=98)
gen_2k.save('ai-finance-platform-main/public/hero-banner.jpg', quality=98)

# Also copy to root public directory for redundancy
shutil.copy('ai-finance-platform-main/public/images/landing-hero-bg.jpg', 'public/images/landing-hero-bg.jpg')
shutil.copy('ai-finance-platform-main/public/hero-banner.jpg', 'public/hero-banner.jpg')

print("Applied 2.5K crystal clear image successfully!")
