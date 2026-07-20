import sys
from rembg import remove
from PIL import Image

def process(input_path, output_path):
    print("Loading image...")
    img = Image.open(input_path)
    print("Removing background...")
    out = remove(img)
    print("Saving...")
    out.save(output_path)
    print("Done!")

if __name__ == "__main__":
    process(sys.argv[1], sys.argv[2])
