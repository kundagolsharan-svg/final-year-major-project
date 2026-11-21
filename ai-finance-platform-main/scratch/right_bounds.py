from PIL import Image
import numpy as np

c1 = Image.open('ai-finance-platform-main/scratch/crop_card_full.png')
arr = np.array(c1)

row100 = arr[100, :]
for x in range(270, 312):
    print(f"x={x}: {row100[x].tolist()}")
