from PIL import Image
import numpy as np

img = Image.open('ai-finance-platform-main/public/hero-banner.jpg')
print("Hero banner dimensions:", img.size)
print("Color mode:", img.mode)

# Sample some areas
arr = np.array(img)
print("Top-left corner rgb:", arr[0, 0])
print("Center rgb:", arr[arr.shape[0]//2, arr.shape[1]//2])
