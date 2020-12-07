#!/usr/bin/env python
import os
import sys
import random
import argparse
import base64
from PIL import Image
import numpy as np

target_image_path = sys.argv[1]
images_directory_path = sys.argv[2]
grid_input = tuple(map(int, sys.argv[3].split()))
output_folder_path = sys.argv[4]

# target_image_path = "./images/cute_turtle.jpg"
# images_directory_path = "./images/turtles"
# grid_input = (50, 50)
# output_folder_path = None


def get_images(images_directory):
    files = os.listdir(images_directory)
    images = []
    for file in files:
        file_path = os.path.abspath(os.path.join(images_directory, file))
        try:
            fp = open(file_path, "rb")
            im = Image.open(fp)
            images.append(im)
            im.load()
            fp.close()
        except:
            print(f"Invalid image {file_path}")
    return images


def get_average_rgb(image):
    im = np.array(image)
    w, h, d = im.shape
    return tuple((np.average(im.reshape(w * h, d), axis=0)))


def split_image(image, size):
    W, H = image.size[0], image.size[1]
    m, n = size
    w, h = int(W / n), int(H / m)
    imgs = []

    for j in range(m):
        for i in range(n):
            imgs.append(image.crop((i * w, j * h, (i + 1) * w, (j + 1) * h)))

    return imgs


def get_best_match_index(input_avg, avgs):
    index = 0
    min_index = 0
    min_error = float("inf")

    for rgb in avgs:
        error = ((rgb[0] - input_avg[0]) * (rgb[0] - input_avg[0]) +
                 (rgb[1] - input_avg[1]) * (rgb[1] - input_avg[1]) +
                 (rgb[2] - input_avg[2]) * (rgb[2] - input_avg[2]))

        if error < min_error:
            min_error = error
            min_index = index

        index += 1

    return min_index


def create_image_grid(images, dimensions):
    m, n = dimensions
    width = max([img.size[0] for img in images])
    height = max([img.size[1] for img in images])
    grid_img = Image.new("RGB", (n * width, m * height))

    for index in range(len(images)):
        row = int(index / n)
        col = index - n * row

        grid_img.paste(images[index], (col * width, row * height))

    return grid_img


def create_photomosaic(target_image, input_images, grid_size, reuse_images=True):
    target_images = split_image(target_image, grid_size)

    output_images = []
    count = 0
    rgb_avgs = []

    for img in input_images:
        try:
            rgb_avgs.append(get_average_rgb(img))
        except ValueError:
            continue

    for img in target_images:
        avg = get_average_rgb(img)
        match_index = get_best_match_index(avg, rgb_avgs)
        output_images.append(input_images[match_index])

        count += 1

        if not reuse_images:
            input_images.remove(match_index)

    mosaic_image = create_image_grid(output_images, grid_size)
    return mosaic_image

# -------------------------------------------------------------------


target_image = Image.open(target_image_path)

# Input images
input_images = get_images(images_directory_path)

# Check for no valid images
if input_images == []:
    # print(f"No valid images found in {images_directory_path}")
    exit()

# Shuffle list
random.shuffle(input_images)

# Size of grid
grid_size = grid_input

# Output
output_filename = "mosaic.jpeg"
if output_folder_path:
    output_filename = output_folder_path

reuse_images = True
resize_input = True

# print("starting mosaic creation")

if not reuse_images:
    if grid_size[0] * grid_size[1] > len(input_images):
        # print("# of images not enough")
        exit()

# Resizing input
if resize_input:
    # print("resizing images...")

    # Compute max w and h of tiles
    dimensions = (int(target_image.size[0] / grid_size[1]),
                  int(target_image.size[1] / grid_size[0]))

    # print(f"max tile dimensions: {dimensions}")

    # Resize
    for img in input_images:
        img.thumbnail(dimensions)

# Create mosaic
mosaic_image = create_photomosaic(
    target_image, input_images, grid_size, reuse_images)

# Save mosaic
mosaic_image.save(output_filename, "jpeg")

# print(f"Saved output to {output_filename}")

# Convert image to base 64
try:
    with open("./mosaic.jpeg", "rb") as imageFile:

        try:
            encodedString = base64.b64encode(imageFile.read())
        except:
            print("Error encoding string")

        # Send base 64 string to parent process
        print(str(encodedString))
except Exception as e:
    print(f"Error: {e}")
