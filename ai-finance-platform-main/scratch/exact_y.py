from PIL import Image
import numpy as np

orig = Image.open(r'C:/Users/shara/.gemini/antigravity/brain/32b1ead9-3bf8-4fac-a382-2f89a8b3456c/.user_uploaded/media_1795230959941_f4d8ac78.jpg')
arr = np.array(orig)

# Let's inspect column 230:
for y in range(430, 445):
    print(f"y={y}: {arr[y, 230].tolist()}")

for y in range(625, 640):
    print(f"y={y}: {arr[y, 230].tolist()}")
