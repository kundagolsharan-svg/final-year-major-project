from PIL import Image

orig = Image.open(r'C:/Users/shara/.gemini/antigravity/brain/32b1ead9-3bf8-4fac-a382-2f89a8b3456c/.user_uploaded/media_1795230959941_f4d8ac78.jpg')

# 1. Full card
full_card = orig.crop((76, 420, 384, 650))
full_card.save('ai-finance-platform-main/scratch/crop_full_card.png')

# 2. Inner landing page window
inner_window = orig.crop((92, 436, 367, 634))
inner_window.save('ai-finance-platform-main/scratch/crop_inner_window.png')

print("full_card:", full_card.size)
print("inner_window:", inner_window.size)
