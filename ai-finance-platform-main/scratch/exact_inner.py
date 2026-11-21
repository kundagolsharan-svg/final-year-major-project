from PIL import Image
import numpy as np

orig = Image.open(r'C:/Users/shara/.gemini/antigravity/brain/32b1ead9-3bf8-4fac-a382-2f89a8b3456c/.user_uploaded/media_1795230959941_f4d8ac78.jpg')
arr = np.array(orig)

# Let's inspect rows around y=435-445, cols around x=90-100
# The inner window has a rounded border.
# Inside the inner window:
# Background is dark near-black: rgb around [0,0,5] or [2,1,6]
# Let's find:
# Top edge: y where inside starts
# Left edge: x where inside starts
# Right edge: x where inside ends
# Bottom edge: y where inside ends

# Let's print row 440 from x=85 to x=110
for x in range(85, 110):
    print(f"x={x}: {arr[440, x].tolist()}")

# And right side around x=355 to x=375
for x in range(355, 375):
    print(f"x={x}: {arr[440, x].tolist()}")
