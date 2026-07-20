import sys
from PIL import Image

def process_image(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    
    datas = list(img.getdata())
    
    newData = []
    for y in range(height):
        for x in range(width):
            item = datas[y * width + x]
            # Crop bottom 20%
            if y > height * 0.8:
                newData.append((0, 0, 0, 0))
            else:
                newData.append(item)

    img.putdata(newData)
    
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")
    print(f"Cropped image saved. New Bbox: {bbox}")

if __name__ == "__main__":
    process_image(sys.argv[1], sys.argv[2])
