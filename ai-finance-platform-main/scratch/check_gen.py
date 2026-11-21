from PIL import Image

gen_path = r'C:\Users\shara\.gemini\antigravity\brain\32b1ead9-3bf8-4fac-a382-2f89a8b3456c\finsight_hero_graphic_v2_1795241040588.jpg'
img = Image.open(gen_path)
print("Generated image size:", img.size, img.format, img.mode)

# Let's inspect ultra sharp size too
ultra_path = 'ai-finance-platform-main/scratch/ultra_sharp_hero.jpg'
ultra = Image.open(ultra_path)
print("Ultra sharp size:", ultra.size, ultra.format, ultra.mode)
