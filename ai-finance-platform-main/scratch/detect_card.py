from PIL import Image
import numpy as np

img = Image.open(r'C:/Users/shara/.gemini/antigravity/brain/32b1ead9-3bf8-4fac-a382-2f89a8b3456c/.user_uploaded/media_1795230959941_f4d8ac78.jpg')
arr = np.array(img)

# Let's inspect the bounding box of the graphic in the center.
# Notice the screenshot has a black background around the card.
# The card itself has a gray outer border or purple gradient.
# Let's inspect rows from 400 to 660, columns from 50 to 410.

# Let's find rows where pixels are clearly not the dark phone background.
# Phone background is around rgb=[0,0,0] or [1,8,14].
print("arr shape:", arr.shape)

# Let's scan along horizontal center line x=230:
for y in range(400, 660, 2):
    r, g, b = arr[y, 230]
    if r > 5 or g > 5 or b > 20:
        print(f"y={y}: [{r},{g},{b}]")
