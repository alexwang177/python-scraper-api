import sys

try:
    from PIL import Image
except:
    print("Error importing PIL")

import base64
import os

# Get image
fp = "./images/cute_turtle.jpg"

try:
    img = Image.open(fp)
except:
    print("Error opening img")

# Operate on image
img = img.rotate(90)

# Save image
img.save("temp_image.jpg")

try:
    # Convert image to base 64
    with open("temp_image.jpg", "rb") as imageFile:

        try:
            encodedString = base64.b64encode(imageFile.read())
        except:
            print("Error encoding string")

        # Send base 64 string to parent process
        print(encodedString)
except:
    print("Cannot open temp image")
