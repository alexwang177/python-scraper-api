#!/usr/bin/env python
import os
import random
import argparse
from PIL import Image
import numpy as np

parser = argparse.ArgumentParser(
    description='Creates a photomosaic from input images')
parser.add_argument('--target', dest='target', required=True,
                    help="Image to create mosaic from")
parser.add_argument('--images', dest='images',
                    required=True, help="Diectory of images")
parser.add_argument('--grid', nargs=2, dest='grid',
                    required=True, help="Size of photo mosaic")
parser.add_argument('--output', dest='output', required=False)

args = parser.parse_args()


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
