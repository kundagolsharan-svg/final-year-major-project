from PIL import Image
import numpy as np

c1 = Image.open('ai-finance-platform-main/scratch/crop_card_full.png')
arr = np.array(c1)

# Let's find the inner mockup window
# The border is visible with values around ~80-120 in row 18-20 or col 18-20
# Let's inspect column 150 across y:
col150 = arr[:, 150]
for y in range(10, 30):
    print(f"y={y}: {col150[y].tolist()}")

for y in range(195, 225):
    print(f"y={y}: {col150[y].tolist()}")
