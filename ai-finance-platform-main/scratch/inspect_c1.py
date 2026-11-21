from PIL import Image
import numpy as np

img = Image.open(r'C:/Users/shara/.gemini/antigravity/brain/32b1ead9-3bf8-4fac-a382-2f89a8b3456c/.user_uploaded/media_1795230959941_f4d8ac78.jpg')
arr = np.array(img)

# Let's save a crop of y from 420 to 652 and x from 70 to 390
c1 = img.crop((74, 420, 386, 652))
c1.save('ai-finance-platform-main/scratch/crop_card_full.png')
print("crop_card_full size:", c1.size)

# Also let's inspect the inner window inside the card!
# Does the card have an outer purple container and an inner mockup?
# Let's check what is in c1:
# Let's print top edge of c1:
c1_arr = np.array(c1)
print("c1 shape:", c1_arr.shape)
# Top-left of c1:
print("c1[0,0]:", c1_arr[0, 0])
print("c1[5,5]:", c1_arr[5, 5])
print("c1[15,15]:", c1_arr[15, 15])
print("c1[25,25]:", c1_arr[25, 25])
