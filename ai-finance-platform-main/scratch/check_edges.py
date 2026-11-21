from PIL import Image
import numpy as np

card = Image.open('ai-finance-platform-main/scratch/crop_full_card.png')
inner = Image.open('ai-finance-platform-main/scratch/crop_inner_window.png')

print("Card corners:")
c_arr = np.array(card)
print("top-left:", c_arr[0:5, 0:5, :])

print("Inner corners:")
i_arr = np.array(inner)
print("top-left:", i_arr[0:5, 0:5, :])
