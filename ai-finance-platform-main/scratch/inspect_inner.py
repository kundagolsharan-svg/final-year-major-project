from PIL import Image
import numpy as np

c1 = Image.open('ai-finance-platform-main/scratch/crop_card_full.png')
arr = np.array(c1)

# In the presentation shot, there is an outer border / background, and inside is the landing page window.
# Let's inspect along row 20, 30, 40 across columns
for y in range(0, 50, 5):
    print(f"y={y}: min_val={arr[y, :, :].min()}, max_val={arr[y, :, :].max()}, mean={arr[y, :, :].mean():.1f}")

# Let's inspect the mockup frame border inside c1
# Look at row 25:
for x in range(0, 50, 2):
    print(f"x={x}: {arr[25, x].tolist()}")
