import sys
from PIL import Image

def process(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    width, height = img.size
    
    newData = []
    for y in range(height):
        for x in range(width):
            item = datas[y * width + x]
            # Crop bottom 20%
            if y > height * 0.8:
                newData.append((0, 0, 0, 0))
            else:
                # Black background removal
                # 45 is a good threshold for dark space backgrounds
                if item[0] < 45 and item[1] < 45 and item[2] < 45:
                    newData.append((0, 0, 0, 0))
                else:
                    newData.append(item)

    img.putdata(newData)
    
    # Crop to content
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")

if __name__ == "__main__":
    process(sys.argv[1], sys.argv[2])
