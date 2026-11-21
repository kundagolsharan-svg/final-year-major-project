from PIL import Image
import numpy as np

img = Image.open(r'C:/Users/shara/.gemini/antigravity/brain/32b1ead9-3bf8-4fac-a382-2f89a8b3456c/.user_uploaded/media_1795230959941_f4d8ac78.jpg')
arr = np.array(img)

# Let's check rows 430, 500, 640 across all x
for row_idx in [430, 480, 550, 640]:
    row = arr[row_idx]
    # find where row has non-background pixels
    # background is dark around rgb < [10, 15, 20]
    is_card = [x for x in range(460) if (row[x] > [15, 15, 25]).any()]
    if is_card:
        print(f"Row {row_idx}: min_x={min(is_card)}, max_x={max(is_card)}")
