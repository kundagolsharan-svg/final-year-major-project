from PIL import Image

inner = Image.open('ai-finance-platform-main/scratch/inner_clean_1920.jpg')
card = Image.open('ai-finance-platform-main/scratch/card_clean_1920.jpg')

print("inner dimensions:", inner.size)
print("card dimensions:", card.size)
